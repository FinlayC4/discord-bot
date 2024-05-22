const fs = require("node:fs"); // File system module
const yaml = require("js-yaml"); // For YAML parsing and stringifying
const path = require('node:path'); // Path utility module

class SettingsManager {
  static #settings = this.#fetchSettings();

  /**
   * Gets the settings of the bot.
   * Gets cached settings by default.
   * @param {Boolean} cached
   * @returns {Object} Object containing settings
   */
  static getSettings(cached = true) {
    if (!cached) {
      this.reloadSettings();
    }

    return this.#settings;
  }

  /**
   * Reloads the settings cached in the manager.
   * @returns {void}
   */
  static reloadSettings() {
    this.#settings = this.#fetchSettings();
  }

  /**
   * Gets the settings of the bot directly from file.
   * @returns {Object} Object containing settings
   */
  static #fetchSettings() {
    const settings = yaml.load(fs.readFileSync(
      path.resolve(__dirname, "../settings.yml"))
    ); // Reading settings.yml file and parsing yml
    return settings;
  }
}