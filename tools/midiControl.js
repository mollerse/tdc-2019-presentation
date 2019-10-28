import dat from "dat.gui";

function normalize(min, max, v) {
  return (v - min) / (max - min);
}

class MidiControl {
  constructor(name) {
    dat.GUI.prototype.removeFolder = function(name) {
      var folder = this.__folders[name];
      if (!folder) {
        return;
      }
      folder.close();
      this.__ul.removeChild(folder.domElement.parentNode);
      delete this.__folders[name];
      this.onResize();
    };

    this.gui = new dat.GUI({ closed: false });
    this.device = { in: null, out: null };
    if (window.navigator.requestMIDIAccess) {
      navigator
        .requestMIDIAccess()
        .then(access => {
          let entries = access.inputs.entries();
          let outries = access.outputs.entries();

          let entry = entries.next();
          while (!entry.done) {
            let [_, d] = entry.value;
            if (d.name === name) {
              this.device.in = d;
              break;
            }
            entry = entries.next();
          }

          let outry = outries.next();
          while (!outry.done) {
            let [_, d] = outry.value;
            if (d.name === name) {
              this.device.out = d;
              break;
            }
            outry = outries.next();
          }

          if (this.device.in) {
            this.device.in.onmidimessage = ({ data }) => {
              let [eventId, keyId, value] = data;
              if (eventId === 144 || eventId === 176) {
                this.trigger(keyId, normalize(0, 127, value));
              }
            };
          } else {
            console.warn(`No MIDI Input named ${name} found.`);
          }

          if (!this.device.out) {
            console.warn(`No MIDI Output named ${name} found.`);
          } else {
            window.__device = this;
          }
        })
        .catch(e => {
          console.warn(e);
        });
    } else {
      console.warn("Midi not available, not enabling midi controls.");
    }
    this.schemes = {};
    this.activeScheme = null;
  }

  // Builder methods

  addScheme(name) {
    if (this.getSchemes().indexOf(name) > -1) {
      throw new Error(
        `Scheme ${name} already exists. Remove existing before adding.`
      );
    }
    this.schemes[name] = {
      values: {},
      triggers: {},
      gui: this.gui.addFolder(name)
    };
    this.activeScheme = name;

    return this;
  }

  addNumberValue(
    key,
    [value, min = 0, max = value, step = 1],
    { onChange, triggerId }
  ) {
    let scheme = this.getScheme();
    scheme.values[key] = value;

    let control = scheme.gui.add(scheme.values, key, min, max, step);

    if (typeof onChange === "function") {
      control.onChange(onChange);
    }

    if (typeof triggerId === "string" || typeof triggerId === "number") {
      scheme.triggers[triggerId] = v => control.setValue(min + v * (max - min));
    }

    return this;
  }

  addBooleanValue(key, [value], { onChange, triggerId }) {
    let scheme = this.getScheme();
    scheme.values[key] = value;

    let control = scheme.gui.add(scheme.values, key);

    if (typeof onChange === "function") {
      control.onChange(onChange);
    }

    if (typeof triggerId === "string" || typeof triggerId === "number") {
      scheme.triggers[triggerId] = () => {
        control.setValue(!control.getValue());
        if (this.device.out) {
          this.device.out.send([144, triggerId, control.getValue() ? 100 : 10]);
        }
      };
    }

    return this;
  }

  // Runtime methods

  loadScheme(name) {
    if (this.getSchemes().indexOf(name) < 0) {
      throw new Error(`Scheme ${name} not found. Please initialize.`);
    }

    if (this.activeScheme === name) {
      console.warn(`Scheme ${name} already active. Skipping.`);
    } else if (this.activeScheme != null) {
      console.warn(`Unloading active scheme ${name}.`);
      this.unloadScheme(this.activeScheme);
    }

    this.activeScheme = name;
  }

  unloadScheme(name) {
    if (this.getSchemes().indexOf(name) < 0) {
      console.warn(`Scheme ${name} not found. Skipping.`);
    }

    if (this.activeScheme === name) {
      this.activeScheme = null;
    }
  }

  removeScheme(name) {
    if (this.getSchemes().indexOf(name) < 0) {
      console.warn(`Scheme ${name} not found. Skipping.`);
    } else {
      this.unloadScheme(name);
      this.gui.removeFolder(name);
      delete this.schemes[name];
    }
  }

  getValue(key) {
    let scheme = this.getScheme();

    return scheme.values[key];
  }

  // Internal stuff
  getScheme(name = this.activeScheme) {
    return this.schemes[name];
  }

  trigger(triggerId, v) {
    let scheme = this.getScheme();
    if (!scheme) return;

    let trigger = scheme.triggers[triggerId];

    trigger && trigger(v);
  }

  // Debug-stuff

  getSchemes() {
    return Object.keys(this.schemes);
  }
}

export default function midiControlFactory(name) {
  return new MidiControl(name);
}
