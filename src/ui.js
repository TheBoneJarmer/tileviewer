function togglePanel(id) {
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

function hideAllPanels() {
    const panels = document.getElementsByClassName("panel");

    for (let panel of panels) {
        panel.style.display = "none";
    }
}

function hidePanel(id) {
    const panel = document.getElementById(id);

    if (panel) {
        panel.style.display = "none";
    }
}

function showPanel(id) {
    const panel = document.getElementById(id);

    if (panel) {
        panel.style.display = "flex";
    }
}