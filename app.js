console.log('Hello World!');
  const editableTextTemplate = document.createElement("template");
  editableTextTemplate.innerHTML = `
    <div id="wrap">
      <span id="input">
        <input id="input-element" type="text">
      </span>
    </div>
  `;
class EditableTextElement extends HTMLElement {
  constructor() {
    super();
    this._value = "";
  }

  connectedCallback() {
    if (!this.shadowRoot) {
    const shadowRoot = this.attachShadow({
      mode: "open",
    });

    if (editableTextTemplate instanceof HTMLTemplateElement) {
      shadowRoot.appendChild(editableTextTemplate.content.cloneNode(true));
    } else {
      shadowRoot.appendChild(editableTextTemplate);
    }
  }


    if (this.shadowRoot) {
      if (this.multiline) {
        // If multiline, replace input with textarea
        const multilineElement = document.createElement("textarea");
        multilineElement.id = "input-element";
        this.shadowRoot.querySelector("#input-element").remove();
        this.shadowRoot.querySelector("#input").appendChild(multilineElement);
      }

      this.$wrap = this.shadowRoot.querySelector("#wrap");
      this.$label = this.shadowRoot.querySelector("#label");
      this.$inputElement = this.shadowRoot.querySelector("#input-element");
    }
        this.dispatchTypeDebouncedEvent = this.makeDispatchChangedValueDebouncedEventEmitter(this.$inputElement);


    this.updateDomForValueAttribute();


    // When the input loses focus, surface an 'editableTextChange'
    // event for consumption by the outside world
    this.$inputElement.onblur = event => {
      // If the blur event is coming from a click on the confirm button, return
      if ((this.explicit_confirm === "" || this.explicit_confirm) && event.relatedTarget) return;
      if (this.$inputElement.classList.contains("keyupping")) {
        this.$inputElement.classList.remove("keyupping");
        return;
      }

      const customEvent = new CustomEvent("editableTextBlur", {
        detail: {
          label: this.label,
          value: this.$inputElement.value,
        },
        bubbles: true,
      });

      this.dispatchEvent(customEvent);

    };


    this.$inputElement.addEventListener("input", () => {
      const event = new CustomEvent("editableTextChangedValue", {
        detail: {
          label: this.label,
          value: this.$inputElement.value,
        },
      });
      this.dispatchEvent(event);
      this.dispatchTypeDebouncedEvent();

    });

    this.$wrap.addEventListener("click", () => {
      this.$inputElement.focus();
    });

    this.addEventListener("focus", () => {
      this.$inputElement.focus();
    });

    // check for outside click from element
    document.addEventListener(
      "click",
      event => {
        const outsideClick = !this.contains(event.target);

        if (outsideClick) {
          this.dispatchEvent(new CustomEvent("editableTextCancelPressed"));
        }
      }
    );

    // check for outside keyup from document
    document.addEventListener(
      "keyup",
      event => {
        console.log({keyup: event});
        if (event.code === "Escape") {
          this.dispatchEvent(new CustomEvent("editableTextCancelPressed"));
          // remove focus class from wrap
          this.$wrap.classList.remove("focus");
          event.stopPropagation();
          event.preventDefault();
          return;
        }

        if (event.code === "Enter") {
          if (!event.shiftKey) this.blur();
          this.dispatchEvent(new CustomEvent("editableTextHardEnterPressed"));

          const customEvent = new CustomEvent("editableTextConfirmPressed", {
            detail: {
              label: this.label,
              value: this.$inputElement.value,
            },
            bubbles: true,
          });
          this.dispatchEvent(customEvent);
        }
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    );

  }




  static get observedAttributes() {
    return ["error", "label", "value", "placeholder", "multiline", "disabled"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "error") {
      if (oldValue !== newValue) {
        this.error = newValue;
        this.updateErrorMessage();
      }
    } else if (name === "label") {
      this.label = newValue;
    } else if (name === "value") {
      this.value = newValue;
    } else if (name === "placeholder") {
      this.placeholder = newValue;
    } else if (name === "multiline") {
      if (newValue !== oldValue) this.multiline = newValue;
    } else if (name === "disabled") {
      if (newValue !== oldValue) this.disabled = newValue;
    }
  }

  makeDispatchChangedValueDebouncedEventEmitter($inputElement) {
    const dispatchChangedValueDebounceEvent = () =>
      this.dispatchEvent(
        new CustomEvent("inlineEditChangedValueDebounce", {
          detail: {
            label: this.label,
            value: $inputElement.value,
          },
          bubbles: true,
        }),
      );
    return dispatchChangedValueDebounceEvent
  }

  /**
   * @param {string} val
   */
  set value(val) {
    if (val === this._value) {
      // If the value hasn't actually changed do not update the dom.
      return;
    }
    this._value = val;

    this.updateDomForValueAttribute();
  }

  get value() {
    return this._value;
  }


  updateDomForValueAttribute() {
    if (!this.$inputElement) return;
    this.$inputElement.value = this.value;
  }



}



if (!customElements.get("editable-text")) {
  // Putting guard rails around this because browsers do not like
  //  having the same custom element defined more than once.
  window.customElements.define("editable-text", EditableTextElement);
}

