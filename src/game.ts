import { Aquanore } from "aquanore";
import { Color, Polygon, Renderer, Texture } from "aquanore/graphics";
import { Vector2 } from "aquanore/math";
import { Cursor, Keyboard } from "aquanore/input";
import { Keys } from "aquanore/enums";
import { Key } from "lucide";

export class Game {
    private static _texTileset: Texture;
    private static _texBackground: Texture;
    private static _polyTileset: Polygon;
    private static _polyBackground: Polygon;
    private static _polyPixel: Polygon;

    private static _frameWidth: number;
    private static _frameHeight: number;
    private static _scale: number;
    private static _spacing: number;
    private static _padding: number;
    private static _gridColor: Color;
    private static _cursorColor: Color;

    private static _viewX: number;
    private static _viewY: number;
    private static _cursorX: number;
    private static _cursorY: number;
    private static _cursorPrevX: number;
    private static _cursorPrevY: number;
    private static _tileX: number;
    private static _tileY: number;

    public static async init() {
        this._frameWidth = 16;
        this._frameHeight = 16;
        this._viewX = 0;
        this._viewY = 0;
        this._cursorX = 0;
        this._cursorPrevX = 0;
        this._cursorY = 0;
        this._cursorPrevY = 0;
        this._tileX = 0;
        this._tileY = 0;
        this._scale = 1;

        await this.initEvents();
        await this.initBackground();
        await this.initPixel();

        await this.resize();
        await this.load();
    }

    private static async initBackground() {
        const cnv = document.createElement("canvas");
        cnv.width = 64;
        cnv.height = 64;

        const ctx = cnv.getContext("2d")!;

        // Generate checkers pattern
        for (let x = 0; x < cnv.width; x++) {
            for (let y = 0; y < cnv.height; y++) {
                if ((x + y) % 2 === 0) {
                    ctx.fillStyle = "#ccc";
                    ctx.fillRect(x, y, 1, 1);
                } else {
                    ctx.fillStyle = "#888";
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        // Generate texture object
        const data = ctx.getImageData(0, 0, cnv.width, cnv.height);
        this._texBackground = new Texture(cnv.width, cnv.height, data);

        // Generate polygon object
        this._polyBackground = Polygon.rectangle(cnv.width, cnv.height);
    }

    private static async initPixel() {
        this._polyPixel = Polygon.rectangle(1, 1);
    }

    private static async initEvents() {
        const btnLoadDisk = document.querySelector("#btn-load-disk") as HTMLButtonElement;
        const linkLoad = document.querySelector("#link-load") as HTMLSpanElement;
        const linkSettings = document.querySelector("#link-settings") as HTMLSpanElement;
        const logo = document.querySelector(".nav .logo") as HTMLImageElement;

        btnLoadDisk.addEventListener("click", async () => {
            await this.onLoadDisk();
        });

        linkLoad.addEventListener("click", async () => {
            await this.togglePanel("load");
        });

        linkSettings.addEventListener("click", async () => {
            await this.togglePanel("settings");
        });

        logo.addEventListener("click", async () => {
            await this.togglePanel("about");
        });
    }

    public static async update() {
        await this.updateInfo();
        await this.updateInput();
        await this.updateControls();
        await this.updateSelection();
    }

    private static async updateSelection() {
        if (!this._texTileset) {
            return;
        }

        const maxHor = Math.floor(this._texTileset.width / this._frameWidth);
        const maxVert = Math.floor(this._texTileset.height / this._frameHeight);

        const tileX = Math.floor((Cursor.x + this._viewX) / this._scale / this._frameWidth);
        const tileY = Math.floor((Cursor.y + this._viewY) / this._scale / this._frameHeight);

        if (Cursor.isButtonPressed(0) && tileX >= 0 && tileY >= 0 && tileX < maxHor && tileY < maxVert) {
            this._tileX = tileX;
            this._tileY = tileY;
        }
    }

    private static async updateInfo() {
        if (!this._texTileset) {
            return;
        }

        const maxHor = this._texTileset.width / this._frameWidth;
        const maxVert = this._texTileset.height / this._frameHeight;

        await this.setLabelValue("width", this._texTileset.width, "px");
        await this.setLabelValue("height", this._texTileset.height, "px");
        await this.setLabelValue("frames-hor", Math.round(this._texTileset.width / this._frameWidth));
        await this.setLabelValue("frames-vert", Math.round(this._texTileset.height / this._frameHeight));
        await this.setLabelValue("tile-hor", this._tileX);
        await this.setLabelValue("tile-vert", this._tileY);
        await this.setLabelValue("tile-x", this._tileX * this._frameWidth);
        await this.setLabelValue("tile-y", this._tileY * this._frameHeight);
        await this.setLabelValue("tile-index", maxHor * this._tileY + this._tileX);
    }

    private static async updateInput() {
        this._scale = await this.getNumberValue("scale", 0);
        this._frameWidth = await this.getNumberValue("frame-width", 16);
        this._frameHeight = await this.getNumberValue("frame-height", 16);
        this._padding = await this.getNumberValue("padding", 0);
        this._spacing = await this.getNumberValue("spacing", 0);
        this._gridColor = await this.getColorValue("grid-color");
        this._cursorColor = await this.getColorValue("cursor-color");

        localStorage.setItem("tile-scale", this._scale.toString());
        localStorage.setItem("tile-frame-width", this._frameWidth.toString());
        localStorage.setItem("tile-frame-height", this._frameHeight.toString());
        localStorage.setItem("tile-padding", this._padding.toString());
        localStorage.setItem("tile-spacing", this._spacing.toString());
        localStorage.setItem("tile-grid-color", this.toHex(this._gridColor));
        localStorage.setItem("tile-cursor-color", this.toHex(this._cursorColor));
    }

    private static async updateControls() {
        this._cursorPrevX = this._cursorX;
        this._cursorPrevY = this._cursorY;
        this._cursorX = Cursor.x;
        this._cursorY = Cursor.y;

        if (Cursor.wheelY > 0 && this._scale > 1) {
            let value = await this.getNumberValue("scale", 1);
            value--;

            await this.setNumberValue("scale", value);
        }

        if (Cursor.wheelY < 0 && this._scale < 10) {
            let value = await this.getNumberValue("scale", 1);
            value++;

            await this.setNumberValue("scale", value);
        }

        if (Cursor.isButtonPressed(0) || Keyboard.keyPressed(Keys.Escape)) {
            await this.hideAllPanels();
        }

        if (Cursor.isButtonDown(1)) {
            const moveX = this._cursorX - this._cursorPrevX;
            const moveY = this._cursorY - this._cursorPrevY;

            this._viewX -= moveX;
            this._viewY -= moveY;
        }

        if (Cursor.isButtonPressed(2)) {
            this._viewX = 0;
            this._viewY = 0;
        }
    }

    public static async render() {
        await this.renderBackground();
        await this.renderSprite();
        await this.renderGrid();
        await this.renderSelection();
    }

    private static async renderSprite() {
        if (!this._texTileset || !this._polyTileset) {
            return;
        }

        const pos = new Vector2(-this._viewX, -this._viewY);
        const scale = new Vector2(this._scale, this._scale);
        const color = new Color(255, 255, 255, 255);
        const origin = new Vector2(0, 0);
        const offset = new Vector2(0, 0);

        Renderer.drawPolygon(this._polyTileset, pos, scale, origin, 0, color, this._texTileset, offset, false, false);
    }

    private static async renderBackground() {
        if (!this._polyBackground || !this._texBackground) {
            return;
        }

        const pos = new Vector2(0, 0);
        const scale = new Vector2(4 * this._scale, 4 * this._scale);
        const origin = new Vector2(0, 0);
        const color = new Color(255, 255, 255, 255);

        const hor = 10;
        const vert = 8;

        for (let x = 0; x < hor; x++) {
            for (let y = 0; y < vert; y++) {
                pos.x = x * this._texBackground.width * scale.x;
                pos.y = y * this._texBackground.height * scale.y;

                Renderer.drawPolygon(this._polyBackground, pos, scale, origin, 0, color, this._texBackground);
            }
        }
    }

    private static async renderGrid() {
        if (!this._polyPixel || !this._texTileset) {
            return;
        }

        const origin = new Vector2(0, 0);
        const hor = this._frameWidth;
        const vert = this._frameHeight;
        const maxHor = this._texTileset.width / hor + 1;
        const maxVert = this._texTileset.height / vert + 1;

        for (let x = 0; x < maxHor; x++) {
            const pos = new Vector2(-this._viewX, -this._viewY);
            pos.x += x * this._scale * hor;

            const scale = new Vector2(1, 1);
            scale.y = this._texTileset.height * this._scale;

            Renderer.drawPolygon(this._polyPixel, pos, scale, origin, 0, this._gridColor);
        }

        for (let y = 0; y < maxVert; y++) {
            const pos = new Vector2(-this._viewX, -this._viewY);
            pos.y += y * this._scale * vert;

            const scale = new Vector2(1, 1);
            scale.x = this._texTileset.width * this._scale;

            Renderer.drawPolygon(this._polyPixel, pos, scale, origin, 0, this._gridColor);
        }
    }

    private static async renderSelection() {
        if (!this._polyPixel || !this._texTileset) {
            return;
        }

        const pos = new Vector2(0, 0);
        const scale = new Vector2(1, 1);
        const origin = new Vector2(0, 0);

        const x = this._tileX * this._frameWidth * this._scale - this._viewX;
        const y = this._tileY * this._frameHeight * this._scale - this._viewY;
        const width = this._frameWidth * this._scale;
        const height = this._frameHeight * this._scale;

        // Draw top line
        pos.x = x;
        pos.y = y;
        scale.x = width;
        scale.y = 2;

        Renderer.drawPolygon(this._polyPixel, pos, scale, origin, 0, this._cursorColor);

        // Draw right line
        pos.x = x + width - 2;
        pos.y = y;
        scale.x = 2;
        scale.y = height;

        Renderer.drawPolygon(this._polyPixel, pos, scale, origin, 0, this._cursorColor);

        // Draw bottom line
        pos.x = x;
        pos.y = y + height - 2;
        scale.x = width;
        scale.y = 2;

        Renderer.drawPolygon(this._polyPixel, pos, scale, origin, 0, this._cursorColor);

        // Draw left line
        pos.x = x;
        pos.y = y;
        scale.x = 2;
        scale.y = height;

        Renderer.drawPolygon(this._polyPixel, pos, scale, origin, 0, this._cursorColor);
    }

    public static async resize() {
        const parent = document.querySelector(".game") as HTMLDivElement;
        const cnv = Aquanore.canvas;

        cnv.width = parent.clientWidth;
        cnv.height = parent.clientHeight;
    }

    private static async load() {
        const url = localStorage.getItem("tile-url");
        const scale = localStorage.getItem("tile-scale");
        const frameWidth = localStorage.getItem("tile-frame-width");
        const frameHeight = localStorage.getItem("tile-frame-height");
        const padding = localStorage.getItem("tile-padding");
        const spacing = localStorage.getItem("tile-spacing");
        const gridColor = localStorage.getItem("tile-grid-color");
        const cursorColor = localStorage.getItem("tile-cursor-color");

        if (url) {
            const img = new Image();

            img.src = url;
            img.onload = () => {
                this._texTileset = new Texture(img.width, img.height, img);
                this._polyTileset = Polygon.rectangle(img.width, img.height);
            }
        }

        if (scale) {
            await this.setNumberValue("scale", parseInt(scale));
        }

        if (frameWidth) {
            await this.setNumberValue("frame-width", parseInt(frameWidth));
        }

        if (frameHeight) {
            await this.setNumberValue("frame-height", parseInt(frameHeight));
        }

        if (padding) {
            await this.setNumberValue("padding", parseInt(padding));
        }

        if (spacing) {
            await this.setNumberValue("spacing", parseInt(spacing));
        }

        if (gridColor) {
            await this.setValue("grid-color", gridColor);
        }

        if (cursorColor) {
            await this.setValue("cursor-color", cursorColor);
        }
    }

    /* DOM FUNCTIONS */
    private static async togglePanel(id: string) {
        const panels = document.getElementsByClassName("panel") as HTMLCollectionOf<HTMLDivElement>;

        for (let panel of panels) {
            if (panel.id === id) {
                continue;
            }

            panel.style.display = "none";
        }

        const el = document.getElementById(id);

        if (!el) {
            return;
        }

        if (el.style.display === "flex") {
            el.style.display = "none";
        } else {
            el.style.display = "flex";
        }
    }

    private static async hideAllPanels() {
        const panels = document.getElementsByClassName("panel") as HTMLCollectionOf<HTMLDivElement>;

        for (let panel of panels) {
            panel.style.display = "none";
        }
    }

    private static async hidePanel(id: string) {
        const panel = document.getElementById(id);

        if (panel) {
            panel.style.display = "none";
        }
    }

    private static async showPanel(id: string) {
        const panel = document.getElementById(id);

        if (panel) {
            panel.style.display = "flex";
        }
    }

    private static async setLabelValue(id: string, value: any, suffix: string = "") {
        const el = document.getElementById(`label-${id}`) as HTMLSpanElement;

        if (!el) {
            return;
        }

        el.innerHTML = `${value}${suffix}`;
    }

    private static async setValue(id: string, value: string) {
        const el = document.getElementById(`input-${id}`) as HTMLInputElement;

        if (!el) {
            return;
        }

        el.value = value;
    }

    private static async setNumberValue(id: string, value: number) {
        const el = document.getElementById(`input-${id}`) as HTMLInputElement;

        if (!el) {
            return;
        }

        const elMin = parseInt(el.min);
        const elMax = parseInt(el.max);

        if (value < elMin) {
            el.value = elMin.toString();
        } else if (value > elMax) {
            el.value = elMax.toString();
        } else {
            el.value = value.toString();
        }
    }

    private static async getNumberValue(id: string, dflt: number = 0) {
        const el = document.getElementById(`input-${id}`) as HTMLInputElement;

        if (!el) {
            return dflt;
        }

        const elValue = parseInt(el.value);
        const elMin = parseInt(el.min);
        const elMax = parseInt(el.max);

        if (elValue < elMin) {
            return elMin;
        }

        if (elValue > elMax) {
            return elMax;
        }

        return elValue;
    }

    private static async getColorValue(id: string) {
        const el = document.getElementById(`input-${id}`) as HTMLInputElement;

        if (!el) {
            return new Color(0, 0, 0);
        }

        const hex = el.value as string;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        return new Color(r,g,b);
    }

    /* HELPER FUNCTIONS */
    private static toHex(color: Color) {
        const r = color.r.toString(16).padStart(2, "0");
        const g = color.g.toString(16).padStart(2, "0");
        const b = color.b.toString(16).padStart(2, "0");

        return `#${r}${g}${b}`;
    }

    /* EVENTS */
    private static async onLoadDisk() {
        const el = document.createElement("input");
        el.type = "file";
        el.accept = "image/*";
        el.click();

        el.addEventListener("change", async () => {
            const panel = document.querySelector("#load") as HTMLDivElement;

            if (panel) {
                panel.style.display = "none";
            }

            if (!el.files || el.files.length === 0) {
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const url = reader.result as string;

                const img = new Image();
                img.src = url;
                img.onload = () => {
                    this._texTileset = new Texture(img.width, img.height, img);
                    this._polyTileset = Polygon.rectangle(img.width, img.height);

                    localStorage.setItem("tile-url", url);
                }
            };

            reader.onerror = () => {
                console.error(`Failed to read image file`);
            };

            reader.readAsDataURL(el.files[0]);
        });
    }
}