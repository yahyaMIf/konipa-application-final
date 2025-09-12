// Implémentation EventEmitter personnalisée pour la compatibilité navigateur
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  off(event, listenerToRemove) {
    if (!this.events[event]) {
      return this;
    }
    
    this.events[event] = this.events[event].filter(
      listener => listener !== listenerToRemove
    );
    
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
    
    return this;
  }

  emit(event, ...args) {
    if (!this.events[event]) {
      return false;
    }
    
    this.events[event].forEach(listener => {
      try {
        listener.apply(this, args);
      } catch (error) {
        }
    });
    
    return true;
  }

  once(event, listener) {
    const onceWrapper = (...args) => {
      this.off(event, onceWrapper);
      listener.apply(this, args);
    };
    
    this.on(event, onceWrapper);
    return this;
  }

  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }

  listenerCount(event) {
    return this.events[event] ? this.events[event].length : 0;
  }

  listeners(event) {
    return this.events[event] ? [...this.events[event]] : [];
  }
}

export { EventEmitter };
export default EventEmitter;