function toggleNavPanel(id) {
    const panels = document.getElementsByClassName("panel");

    for (let panel of panels) {
        if (panel.id === id) {
            continue;
        }
        
        panel.style.display = "none";
    }

    const el = document.getElementById(id);

    if (el.style.display === "flex") {
        el.style.display = "none";
    } else {
        el.style.display = "flex";
    }
}