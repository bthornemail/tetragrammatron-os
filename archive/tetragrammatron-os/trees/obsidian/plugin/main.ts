import { Plugin } from "obsidian";

export default class TetragrammatronOSPlugin extends Plugin {
  async onload() {
    console.log("Tetragrammatron-OS plugin loaded");

    // Listen for messages from Web Viewer
    window.addEventListener("message", (event) => {
      if (event.data && event.data.type === "ulp-open-path") {
        const path = event.data.path;
        if (path) {
          // Open file in Obsidian
          const file = this.app.vault.getAbstractFileByPath(path);
          if (file) {
            this.app.workspace.openLinkText(path, "", false);
          } else {
            console.warn(`File not found: ${path}`);
          }
        }
      }
    });
  }

  onunload() {
    console.log("Tetragrammatron-OS plugin unloaded");
  }
}

