const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { generateTokens, verifyRefreshToken } = require("../middleware/auth");
const { sendActivationEmail } = require('../utils/sendEmail');
const UserStatus = require("../models/UserStatus");

// REGISTER USER
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, keywords } = req.body;

    // Validate role
    if (!["job_seeker", "employer", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Validate keywords for job seekers/employers
    if (["job_seeker", "employer"].includes(role) && (!keywords || !keywords.length)) {
      return res.status(400).json({ message: "Keywords are required for job seekers or employers" });
    }

    // Validate password strength
    const passwordRequirements = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRequirements.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long, include one uppercase letter, and one number.",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Hash password and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      keywords,
    });

    return res.redirect('/login');
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};



exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user credentials
    const user = await User.findOne({ email });

    // If the user doesn't exist or the password is invalid
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Fetch user's active status from the UserStatus collection
    const userStatus = await UserStatus.findOne({ userId: user._id });

    // Handle inactive users
    if (userStatus?.isActive === false) {
      await sendActivationEmail(email);
      return res.status(403).json({
        message: "User account is deactivated. An email has been sent with details to reactivate your account.",
      });
    }

    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      keywords: user.keywords
    };
    console.log(req.session.user);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Set tokens in cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true, // Protect the cookie from JavaScript access
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax", // Allows cookies to be sent with cross-origin requests
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    // Redirect based on user role
    if (user.role === "admin") {
      return res.render("users/admin_dashboard", { user });
    } else if (user.role === "job_seeker") {
      return res.render("users/jobSeeker_dashboard", { user });
    } else if (user.role === "employer") {
      return res.render("users/employer_dashboard", { user });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

  } catch (error) {
    console.error("Error during login:", error); // Debugging log
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// REFRESH TOKEN
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

    const { user } = verifyRefreshToken(refreshToken);
    const newAccessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ message: "Invalid refresh token", error });
  }
};

// LOGOUT USER
exports.logoutUser = (req, res) => {
  console.log("Logout request received");
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  req.session.user = null; // Clear the user session
  res.redirect('/login?message=Successfully logged out'); // Redirect with a message
};




// userController.js
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, keywords } = req.body;

    const keywordArray = keywords ? keywords.split(',').map(kw => kw.trim()) : [];

    const updates = { name, keywords: keywordArray };

    // Update user in the database
    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.redirect('/users/profile/' + user._id + '?message=Profile updated successfully');
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: err.message });
  }
};


// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_GMAIL,
        pass: process.env.MY_PASSWORD,
      },
    });

    const resetLink = `${process.env.CLIENT_URL}/resetPassword?token=${token}`;

    const mailOptions = {
      from: process.env.MY_GMAIL,
      to: email,
      subject: "Password Reset Request",
      text: `Click on this link to reset your password: ${resetLink}`
    };

    await transporter.sendMail(mailOptions);
    res.render('users/passwordResetSent')
    //return res.redirect('passwordResetSent')
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate and hash new password
    const passwordRequirements = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRequirements.test(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long, include an uppercase letter, and a number.",
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Send only one response
    res.status(200).redirect("/login");

  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "Invalid or expired token" });
  }
};