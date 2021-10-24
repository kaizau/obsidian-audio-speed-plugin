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
      // Audio elements are dynamically injected after post-processors are
      // registered, so we need to detect them by src extensions.
      const embedElements = Array.from(el.querySelectorAll(".internal-embed"));
      const audioElements = embedElements.filter((embedEl) => {
        const src = embedEl.getAttribute("src");
        if (!src) return;
        const ext = src.split(".").pop();
        return audioExtensions.includes(ext);
      });

      // If found, wait for the <audio> elements to appear before updating the
      // playbackRate. 500ms is a compromise magic number.
      if (audioElements.length) {
        setTimeout(() => {
          audioElements.forEach((spanEl) => {
            const audioEl = spanEl.querySelector("audio");
            if (audioEl) {
              audioEl.playbackRate = this.settings.speed;
              spanEl.classList.add("audio-speed-plugin");
            }
          });
        }, 500);
      }
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

    const setting = new Setting(containerEl)
      .setName("Audio Playback Speed")
      .setDesc(`Current: ${this.plugin.settings.speed}x`);

    setting.addSlider((slider) =>
      slider
        .setLimits(0.5, 3.0, 0.1)
        .setValue(this.plugin.settings.speed)
        .onChange(async (speed: number) => {
          this.plugin.settings.speed = speed;
          await this.plugin.saveSettings();
          slider.setDynamicTooltip();
          setting.setDesc(`Current: ${this.plugin.settings.speed}x`);
        })
    );
  }
}
