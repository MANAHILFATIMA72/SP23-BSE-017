<script>
    // Function to show the intro
    function showIntro() {
        document.getElementById("introBox").style.display = "block";
    }

    // Function to hide the intro
    function hideIntro() {
        document.getElementById("introBox").style.display = "none";
    }

    // Add event listeners
    document.querySelector(".photo img").addEventListener("mouseover", showIntro);
    document.querySelector(".photo img").addEventListener("mouseout", hideIntro);
</script>
