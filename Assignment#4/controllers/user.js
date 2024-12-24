const User = require('../models/user');

// REGISTER USER
exports.SignUp = async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
  
      // Validate role
      if (!["customer", "admin"].includes(role)) {
        req.flash("error", "Invalid role specified.");
        return res.redirect("/SignUp");
      }
  
      // Validate password strength
      const passwordRequirements = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
      if (!passwordRequirements.test(password)) {
        req.flash("error", "Password must be at least 8 characters long, include an uppercase letter, and a number.");
        return res.redirect("/SignUp");
      }
  
      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        req.flash("error", "Email is already registered.");
        return res.redirect("/SignUp");
      }
  
      // Hash password and save user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
      });
    //   req.flash("success", "Registration successful! Please log in.");
      return res.redirect('/login');
    } catch (error) {
    //   req.flash("error", "Internal Server Error.");
      res.redirect("/SignUp");
    }
  };