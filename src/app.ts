import { Aquanore, AquanoreOptions } from "aquanore";

import { Game } from "./game";

const options = new AquanoreOptions();
options.canvas.dom = document.querySelector("canvas");
options.canvas.autoResize = false;
options.shadow.enabled = false;

await Aquanore.init(options);

Aquanore.onLoad = onLoad;
Aquanore.onUpdate = onUpdate;
Aquanore.onRender2D = onRender2D;
Aquanore.onResize = onResize;

await Aquanore.run();

/* CALLBACKS */
async function onLoad() {
    await Game.init();
}

async function onUpdate(dt: number) {
    await Game.update();
}

async function onRender2D() {
    await Game.render();
}

async function onResize() {
    await Game.resize();
}