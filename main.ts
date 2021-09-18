import {
  App,
  MarkdownPostProcessor,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";

interface AudioSpeedPluginSettings {
  speed: number;
}

const DEFAULT_SETTINGS: AudioSpeedPluginSettings = {
  speed: 2.0,
};

const audioExtensions = ["mp3", "ogg", "m4a", "wav", "flac"];

export default class AudioSpeedPlugin extends Plugin {
  settings: AudioSpeedPluginSettings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new AudioSpeedSettingTab(this.app, this));

    this.registerMarkdownPostProcessor((el, ctx) => {
      const embedElements = el.querySelectorAll(".internal-embed");
      embedElements.forEach((embedEl) => {
        const src = embedEl.getAttribute("src");
        if (!src) return;

        const ext = src.split(".").pop();
        if (!audioExtensions.includes(ext)) return;

        const file = this.app.metadataCache.getFirstLinkpathDest(
          src,
          ctx.sourcePath
        );
        const filePath = file.vault.getResourcePath(file);

        const audioEl = document.createElement("audio");
        audioEl.setAttribute("src", filePath);
        audioEl.controls = true;
        audioEl.playbackRate = this.settings.speed;

        embedEl.innerHTML = "";
        embedEl.appendChild(audioEl);
        embedEl.className += " media-embed is-loaded audio-speed-plugin";
      });
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class AudioSpeedSettingTab extends PluginSettingTab {
  plugin: AudioSpeedPlugin;

  constructor(app: App, plugin: AudioSpeedPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "Audio Speed Settings" });

    new Setting(containerEl).setName("Audio Playback Speed").addText((text) =>
      text
        .setPlaceholder("2.0")
        .setValue(this.plugin.settings?.speed + "" || "")
        .onChange(async (value) => {
          const speed = parseFloat(value);
          this.plugin.settings.speed = Number.isNaN(speed) ? 2.0 : speed;
          await this.plugin.saveSettings();
        })
    );
  }
}
