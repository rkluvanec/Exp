class Exp {
    constructor(settings) {
        /* Find application element */
        this.el = settings.el || null;
        this.app = null;
        this.attach = settings.attach || null;
        var anim = function(A) {
            A = function(n, g, t, e) {
              var a, o, c,
                q = [],
                cb = function(i) {
                  //our internal callback function maintains a queue of objects 
                  //that contain callback info. If the object is an array of length
                  //over 2, then it is parameters for the next animation. If the object
                  //is an array of length 1 and the item in the array is a number,
                  //then it is a timeout period, otherwise it is a callback function.
                  if(i = q.shift()) i[1] ?
                      A.apply(this, i).anim(cb) :
                      i[0] > 0 ? setTimeout(cb, i[0]*1000) : (i[0](), cb())
                };
            
              if(n.charAt) n = document.getElementById(n);
            
              //if the 1st param is a number then treat it as a timeout period.
              //If the node reference is null, then we skip it and run the next callback
              //so that we can continue with the animation without throwing an error.
              if(n > 0 || !n) g = {}, t = 0, cb(q = [].push([n || 0]));
            
              //firefox don't allow reading shorthand CSS styles like "margin" so
              //we have to expand them to be "margin-left", "margin-top", etc.
              //Also, expanding them allows the 4 values to animate independently 
              //in the case that the 4 values are different to begin with.
              expand(g, {padding:0, margin:0, border:"Width"}, [T, R, B, L]);
              expand(g, {borderRadius:"Radius"}, [T+L, T+R, B+R, B+L]);
            
              //if we animate a property of a node, we set a unique number on the
              //node, so that if we run another animation concurrently, it will halt
              //the first animation. This is needed so that if we animate on mouseover
              //and want to reverse the animation on mouseout before the mouseover
              //is complete, they won't clash and the last animation prevails.
              ++mutex;
            
              for(a in g) {
                o = g[a];
                if(!o.to && o.to !== 0) o = g[a] = {to: o};  //shorthand {margin:0} => {margin:{to:0}}
            
                A.defs(o, n, a, e);  //set defaults, get initial values, selects animation fx
              }
            
              A.iter(g, t*1000, cb);
            
              return {
                //this allows us to queue multiple animations together in compact syntax
                anim: function() {
                  q.push([].slice.call(arguments));
                  return this
                }
              }
            };
            
            var T="Top", R="Right", B="Bottom", L="Left",
              mutex = 1,
            
              //{border:1} => {borderTop:1, borderRight:1, borderBottom:1, borderLeft:1}
              expand = function(g, dim, dir, a, i, d, o) {
                for(a in g) {  //for each animation property
                  if(a in dim) {
                    o = g[a];
                    for(i = 0; d = dir[i]; i++)  //for each dimension (Top, Right, etc.)
                      //margin => marginTop
                      //borderWidth => borderTopWidth
                      //borderRadius => borderTopRadius
                      g[a.replace(dim[a], "") + d + (dim[a] || "")] = {
                        to:(o.to === 0) ? o.to : (o.to || o), fr:o.fr, e:o.e
                      };
                    delete g[a];
                  }
                }
              },
            
              timeout = function(w, a) {
                return w["r"+a] || w["webkitR"+a] || w["mozR"+a] || w["msR"+a] || w["oR"+a]
              }(window, "equestAnimationFrame");
            
            A.defs = function(o, n, a, e, s) {
              s = n.style;
              o.a = a;  //attribute
              o.n = n;  //node
              o.s = (a in s) ? s : n;  //= n.style || n
              o.e = o.e || e;  //easing
            
              o.fr = o.fr || (o.fr === 0 ? 0 : o.s == n ? n[a] :
                    (window.getComputedStyle ? getComputedStyle(n, null) : n.currentStyle)[a]);
            
              o.u = (/\d(\D+)$/.exec(o.to) || /\d(\D+)$/.exec(o.fr) || [0, 0])[1];  //units (px, %)
            
              //which animation fx to use. Only color needs special treatment.
              o.fn = /color/i.test(a) ? A.fx.color : (A.fx[a] || A.fx._);
            
              //the mutex is composed of the animating property name and a unique number
              o.mx = "anim_" + a;
              n[o.mx] = o.mxv = mutex;
              if(n[o.mx] != o.mxv) o.mxv = null;  //test expando
            };
            
            A.iter = function(g, t, cb) {
              var _, i, o, p, e,
                z = +new Date + t,
            
              _ = function() {
                i = z - new Date().getTime();
            
                if(i < 50) {
                  for(o in g)
                    o = g[o],
                    o.p = 1,
                    o.fn(o, o.n, o.to, o.fr, o.a, o.e);
            
                  cb && cb()
            
                } else {
            
                  i = i/t;
            
                  for(o in g) {
                    o = g[o];
            
                    if(o.n[o.mx] != o.mxv) return;  //if mutex not match then halt.
            
                    e = o.e;
                    p = i;
            
                    if(e == "lin") {
                      p = 1 - p
              
                    } else if(e == "ease") {
                      p = (0.5 - p)*2;
                      p = 1 - ((p*p*p - p*3) + 2)/4
              
                    } else if(e == "ease-in") {
                      p = 1 - p;
                      p = p*p*p
              
                    } else {  //ease-out
                      p = 1 - p*p*p
                    }
                    o.p = p;
                    o.fn(o, o.n, o.to, o.fr, o.a, o.e)
                  }
                  timeout ? timeout(_) : setTimeout(_, 20)
                }
              }
              _();
            };
            
            A.fx = {  //CSS names which need special handling
            
              _: function(o, n, to, fr, a, e) {  //for generic fx
                fr = parseFloat(fr) || 0,
                to = parseFloat(to) || 0,
                o.s[a] = (o.p >= 1 ? to : (o.p*(to - fr) + fr)) + o.u
              },
            
              width: function(o, n, to, fr, a, e) {  //for width/height fx
                if(!(o._fr >= 0))
                  o._fr = !isNaN(fr = parseFloat(fr)) ? fr : a == "width" ? n.clientWidth : n.clientHeight;
                A.fx._(o, n, to, o._fr, a, e)
              }
            };
            A.fx.height = A.fx.width;
            return A
        }();
        this.$anim = anim;
        this.$validateEmail = function(email) {
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }

        this.recommendations = settings.recommendations || {};
        this.scoped = settings.scoped || false;

        this.data = settings.data || {};
        this.methods = settings.methods || {};
        this.mounted = settings.mounted || null;

        this.__storage = {
            loopDefinitions: {},
            initializedLoops: {}
        };
        this.backdrop = null;

        this.html = (_ => {
            if (settings.html !== undefined) return settings.html;
            if (settings.context !== undefined) {
                if (settings.context.html !== undefined) return settings.context.html;
            }

            return null;
        })();

        this.style = (_ => {
            if (settings.style !== undefined) return settings.style;
            if (settings.context !== undefined) {
                if (settings.context.style !== undefined) return settings.context.style;
            }

            return null;
        })();

        this.sdk = (_ => {
            if (settings.context !== undefined) {
                if (settings.context.sdk !== undefined) return settings.context.sdk;
            }

            return null;
        })();

        this.context = (_ => {
            if (settings.context !== undefined) {
                if (settings.context.data !== undefined) return settings.context.data;
            }

            return null;
        })();

        this.inPreview = (_ => {
            if (settings.context !== undefined) {
                if (settings.context.inPreview !== undefined) return settings.context.inPreview;
            }

            return false;
        })();

        /* tracking by default false */
        if (settings.tracking === undefined) {
            this.tracking = true;
        } else {
            this.tracking = settings.tracking;
        }

        this.trigger = settings.trigger || null;
        this.control_group = settings.control_group || false;
        if (settings.branded === undefined || (settings.branded && settings.branded !== "black" && settings.branded !== "white")) {
            this.branded = 'black';
        } else {
            this.branded = settings.branded;
        }
        this.supportedAttributes = ["src", "href", "alt"];
        /* init model */
        this.model = {
            $refs: {}
        };

        /* method for rendering the banner */
        var render = function(self) {
            if(!self.control_group){
                self.init();
                /* init watcher */
                self.watcher(self.data);
                /* bind all models and methods */
                self.bindModels();
                self.bindMethods();
                /* move methods to model for outside use */
                self.moveMethods();
                if (settings.backdrop) self.addBackdrop(settings.backdrop);
                if (settings.position) self.moveToPosition(settings.position);
            }
            self.loaded();
            if(!self.control_group){
                if(self.branded === "white"){
                    self.addBranding("white");
                } else if (self.branded){
                    self.addBranding("black");
                }
                self.addAnimationClass();
                self.bindAttributes();
                self.bindFors();
                self.loadRcm();
                self.bindClose();
                self.bindRefs();
                self.bindAction();
            }
            return self.model;
        }

        /* if trigger exists, render based on the type of the trigger */
        if (this.trigger !== null && !this.inPreview) {
            if (this.trigger.type == "onready") {
                /* renders banner once page's elements are rendered */
                const delay = this.trigger.delay || 0;
                var self = this;
                window.addEventListener('load', function() {
                    setTimeout(() => {
                        render(self);
                    }, delay);
                });
                return;
            } else if (this.trigger.type == "onexit") {
                /* renders banner if user wants to leave the page */
                const delay = this.trigger.delay || 0;
                window.__exp_triggered = false;
                var self = this;
                document.body.addEventListener("mouseleave", function (e) {
                    /* check window was left */
                    if (e.offsetY - window.scrollY < 0 && !window.__exp_triggered) {
                        window.__exp_triggered = true;
                        setTimeout(() => {
                            render(self);
                        }, delay);
                    }
                });
                return;
            } else if (this.trigger.type = "onaction"){
                var self = this;
                var el = this.trigger.element;
                var action = this.trigger.action || "click";
                const delay = this.trigger.delay || 0;
                if(el){
                    el.addEventListener(action, function(){
                        setTimeout(() => {
                            render(self);
                        }, delay);
                    });
                }
                return;
            } else {
                /* if incorrect type of trigger is given do not render at all */
                return;
            }
        }

        return render(this);
    }

    /* initialization logic */
    init() {
        this.model.$anim = this.$anim
        this.model.$validateEmail = this.$validateEmail
        

        /* handles HTML, EL, APP, attach settings */
        if (this.el !== null) {
            /* find element in place */
            this.app = document.querySelector(this.el);
        } else if (this.html !== null) {
            /* insert HTML to page */
            let el = document.createElement('div');
            el.innerHTML = this.html.trim();
            
            /* append the element to target or to body */
            if (this.attach !== null) {
                this.app = document.querySelector(this.attach).appendChild(el.firstChild);
            } else {
                this.app = document.body.appendChild(el.firstChild);
            }
        } else {
            return;
        }

        /* handles CSS inserting and scoping */
        if (this.style !== null) {
            if (this.scoped) {
                let style = this.addStyle(this.style, true)
                let rules = this.listify(style.sheet.cssRules);
                var scopedStyle = "";

                /* iterate over CSS rules */
                rules.forEach(rule => {
                    /* rule is actually rule */
                    if (rule instanceof CSSStyleRule) {
                        scopedStyle = scopedStyle + this.generateScopedRule(rule);
                    }

                    /* rule is media query */
                    if (rule instanceof CSSMediaRule) {
                        scopedStyle = scopedStyle + `@media${rule.conditionText} {`
                        this.listify(rule.cssRules).forEach(rule => {
                            scopedStyle = scopedStyle + this.generateScopedRule(rule);
                        });
                        scopedStyle = scopedStyle + `}`;
                    }
                });

                /* append scoped style */
                this.addStyle(scopedStyle);

                /* remove original style */
                style.parentNode.removeChild(style);
            } else {
                /* append style */
                this.addStyle(this.style);
            }
        }

        /* register removeBanner method for use in object */
        this.methods.removeBanner = this.removeBanner.bind(this, this.app);
        this.model.sdk = this.sdk;
    }

    getEventProperties(action, interactive) {
        if (this.context === null) return;
        return { 
            action: action,
            banner_id: this.context.banner_id,
            banner_name: this.context.banner_name,
            banner_type: this.context.banner_type,
            variant_id: this.context.variant_id,
            variant_name: this.context.variant_name,
            interaction: interactive !== false ? true : false,
            location: window.location.href,
            path: window.location.pathname
        };
    }

    /* handle POSITION option */
    moveToPosition(position) {
        if (this.app === null) return;
        if (typeof position === "object") {
            this.setStyleFromObject(position, this.app);
        } else {
            this.setPositionFromString(position, this.app);
        }

        /* this is bug, what if element is inserted to page? can't use fixed */
        this.setStyleFromObject({ "position": "fixed" }, this.app)
    }

    /* add inline style to element */
    setStyleFromObject(object, el) {
        for (var property in object) {
            el.style[property] = object[property];
        }
    }

    /* parse POSITION string */
    setPositionFromString(position, el) {
        const offset = "20px";
        const positionStyles = {
            middle: {
                "left": "50%",
                "top": "50%",
                "transform": "translate(-50%,-50%)"
            }
        }
        let positions = position.split(' ');
        positions.forEach(pos => {
            if (pos in positionStyles) {
                this.setStyleFromObject(positionStyles[pos], el);
            } else {
                let styleObj = {}
                styleObj[pos] = offset
                this.setStyleFromObject(styleObj, el);
            }
        });
    }

    /* handle BACKDROP optioin */
    addBackdrop(style) {
        if (this.app == null) return;
        let backdropStyle = { 
            "position": "fixed",
            "top": "0",
            "left": "0",
            "width": "100vw",
            "height": "100vh",
            "z-index": "999999",
            "background": "rgba(0,0,0,0.7)"
        }

        for (var key of Object.keys(style)) {
            backdropStyle[key] = style[key];
        }

        let backdrop = document.createElement('div');
        this.setStyleFromObject(backdropStyle, backdrop);
        this.app.parentNode.style['position'] = "relative";
        this.app.style["z-index"] = "9999999";
        this.backdrop = this.app.parentNode.appendChild(backdrop);

        this.backdrop.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.removeBanner();
            /* track 'close' if tracking is set to true */
            if (this.tracking && this.sdk !== null && this.context !== null) {
                this.sdk.track('banner', this.getEventProperties('close'));
            }
        })
    }

    /* call MOUNTED lifecycle hook */
    loaded() {
        /* track 'show' if tracking is set to true */
        if (this.tracking && this.sdk !== null && this.context !== null) {
            this.sdk.track('banner', this.getEventProperties('show', false));
        }
        if (this.mounted !== null && !this.control_group) this.mounted.call(this.model);
    }

    /* remove banner */
    removeBanner() {
        if (this.app === null) return
        this.app.parentNode.removeChild(this.app);
        if (this.backdrop !== null) this.backdrop.parentNode.removeChild(this.backdrop);
    }

    /* method for inserting stylesheet */
    addStyle(css, disabled = false){
        if (this.app === null) return;
        let style = document.createElement('style');
        style.type= 'text/css';
        style.appendChild(document.createTextNode(css)); // doesn't work in IE8 and less

        let inserted = this.app.appendChild(style);
        inserted.sheet.disabled = disabled;
        return inserted;
    }

    /* not used, not sure why it is here */
    getSelectorText(rules) {
        var ruleList = [];
        Array.prototype.slice.call(rules).forEach(rule => {
            ruleList.push(rule);
        });
    }

    /* helper method for adding attribute, used by CSS scoping */
    addAttributes(selector, attr, val = "") {
        this.select(selector).forEach(el => {
            el.setAttribute(attr, val);
        })
    }

    /* helper method for generating unique IDs, used by CSS scoping */
    getUuid() {
        var firstPart = (Math.random() * 46656) | 0;
        var secondPart = (Math.random() * 46656) | 0;
        firstPart = ("000" + firstPart.toString(36)).slice(-3);
        secondPart = ("000" + secondPart.toString(36)).slice(-3);
        return firstPart + secondPart;
    }

    /* method for adding unique ID to CSS selectors */
    generateScopedRule(rule) {
        let selectors = rule.selectorText.split(',');
        let selectorsText = selectors.map(selector => {
            let attr = `exp-${this.getUuid()}`;
            this.addAttributes(selector.trim(), attr);
            if (this.select(selector.trim()).length > 0) {
                return `${selector}[${attr}]`;
            }
            return  `${selector}`;
        });

        return `${selectorsText.join()} { ${rule.style.cssText} }`;
    }

    /* move methods from METHODS option to `this` scope */
    moveMethods() {
        if (this.methods === null) return;

        for (var key of Object.keys(this.methods)) {
            this.model[key] = this.methods[key];
        }
    }

    /* method for updating all exp-binds */
    updateBindings(key, value) {
        const bindings = this.select(`*[exp-bind="${key}"]`);

        bindings.forEach(el => {
            el.textContent = value;
        });
    }

    /* cool hack */
    overridePush(array, arrayName, key) {
        let self = this;
        array.push = (_ => {
            var original = Array.prototype.push;
            return function() {
                const ret = original.apply(this, arguments);
                self.updateFors(arrayName, key, arguments[0]);
                return ret;
            };
        })();
    }

    rec(items, dict) {
        if (items.length == 1) return dict[items[0]];
        else return rec(items.slice(1), dict[items[0]]);
    }

    updateFors(arrayName, key, item) {
        this.__storage.loopDefinitions[arrayName].forEach(def => {
            const template = def.template.cloneNode(true);
            const hash = def.hash;

            let attrSelector = this.supportedAttributes.map(attr => {
                return `*[exp-${attr}]`;
            });

            const expFors = this.select(`[exp-for="${key} in ${arrayName}"][${hash}], [exp-rcm="${key} in ${arrayName}"][${hash}]`);
            const expForRefs = this.select(`[exp-for-ref="${key} in ${arrayName}"][${hash}]`);
            const expAttrs = this.select(attrSelector.join(), template);
            const expBinds = this.select(`[exp-bind]`, template);

            expAttrs.forEach(el => {
                this.supportedAttributes.forEach(attr => {
                    const val = el.getAttribute('exp-' + attr);
                    if (val === null) return;

                    if (val.indexOf('.') == -1) {
                        el[attr] = item;
                    } else {
                        const keys = val.split('.');
                        const value = this.rec(keys.slice(1), item);
                        el[attr] = value;
                    };
                });
            });

            expBinds.forEach(el => {
                const val = el.getAttribute('exp-bind');
                if (val.indexOf('.') == -1) {
                    el.textContent = item;
                } else {
                    const keys = val.split('.');
                    var value = this.rec(keys.slice(1), item);
                    el.textContent = value
                }
            });

            if (expFors.length > 0) {
                expFors.forEach(expFor => {
                    let el = document.createElement('div');
                    if (template.tagName == 'TR') {
                        el = document.createElement('tbody');
                    }
                    if (template.tagName == 'TD') {
                        el = document.createElement('tr');
                    }
                    template.removeAttribute('exp-for');
                    template.removeAttribute('exp-rcm');
                    template.removeAttribute(hash);
                    el.innerHTML = template.outerHTML.trim();
                    el.firstChild.setAttribute('exp-for-ref', `${key} in ${arrayName}`);
                    el.firstChild.setAttribute(hash, '');
                    expFor.parentNode.replaceChild(el.firstChild, expFor);
                    this.bindMethods(el);
                });
            }

            if (expForRefs.length > 0) {
                expForRefs.forEach(ref => {
                    let el = document.createElement('div');
                    if (template.tagName == 'TR') {
                        el = document.createElement('tbody');
                    }
                    if (template.tagName == 'TD') {
                        el = document.createElement('tr');
                    }
                    template.removeAttribute('exp-for');
                    template.removeAttribute('exp-rcm');
                    el.innerHTML = template.outerHTML.trim();
                    ref.removeAttribute('exp-for-ref');
                    ref.removeAttribute(hash);
                    el.firstChild.setAttribute('exp-for-ref', `${key} in ${arrayName}`);
                    el.firstChild.setAttribute(hash, '');
                    ref.parentNode.insertBefore(el.firstChild, ref.nextSibling);
                    this.bindMethods(el);
                });
            }
        });
    }

    loadRcm() {
    	const keys = Object.keys(this.recommendations);
        for (let i = 0; i < keys.length; i++) {
            if (this.model[keys[i]]) {
                var options = {
                    recommendationId: this.recommendations[keys[i]].id,
                    size: this.recommendations[keys[i]].total,
                    callback: data => {
                        if (data && data.length > 0) {
                            data.forEach(item => {
                                this.model[keys[i]].push(item)
                            })
                        }
                        if (this.recommendations[keys[i]].loadingKey !== undefined) {
                            this.model[this.recommendations[keys[i]].loadingKey] = true;
                        }
                    },
                    fillWithRandom: true
                };
                
                if (this.sdk && this.sdk.getRecommendation) {
                    this.sdk.getRecommendation(options);
                } else {
                    if (this.recommendations[keys[i]].loadingKey !== undefined) {
                        this.model[this.recommendations[keys[i]].loadingKey] = true;
                    }
                }
            }
        }
    }

    bindFors() {
        const expFors = this.select(`[exp-for], [exp-rcm]`);
        expFors.forEach(expFor => {
            let attr = expFor.hasAttribute('exp-for') ? 'exp-for' : 'exp-rcm';
            let key = expFor.getAttribute(attr).split(' ')[0];
            let arrayName = expFor.getAttribute(attr).split(' ')[2];
            this.__storage.loopDefinitions[arrayName] = [];
            this.__storage.initializedLoops[arrayName] = false;
        });

        expFors.forEach(expFor => {
            let attr = expFor.hasAttribute('exp-for') ? 'exp-for' : 'exp-rcm';
            let key = expFor.getAttribute(attr).split(' ')[0];
            let arrayName = expFor.getAttribute(attr).split(' ')[2];
            let hash = 'e-' + this.getUuid();
            expFor.setAttribute(hash, '');
            let template = expFor.cloneNode(true);

            this.__storage.loopDefinitions[arrayName].push({
                template,
                hash
            });
        });

        expFors.forEach(expFor => {
            let attr = expFor.hasAttribute('exp-for') ? 'exp-for' : 'exp-rcm';
            let key = expFor.getAttribute(attr).split(' ')[0];
            let arrayName = expFor.getAttribute(attr).split(' ')[2];

            if (!this.__storage.initializedLoops[arrayName]) {
                if (this.model[arrayName]) {
                    this.model[arrayName].forEach(item => {
                        this.updateFors(arrayName, key, item);
                    });
                } else {
                    this.model[arrayName] = [];
                    this.overridePush(this.model[arrayName], arrayName, key);
                }
            }
            this.__storage.initializedLoops[arrayName] = true;
        })
    }

    /* method for updating input exp-models */
    updateModels(key, value) {
        const modelBindings = this.select(`*[exp-model="${key}"]`);

        modelBindings.forEach(input => {
            const model = input.getAttribute("exp-model");
            const type = input.getAttribute("type");
            
            /* handle different input types */
            if (type == "checkbox") {
                input.checked = !!value;
            } else if (type == "radio") {
                if (input.value == value) input.checked = true;
            } else {
                input.value = value;
            }
        });
    }

    /**
     * method for updating exp-ifs
     * possible bug: doesn't check the original display value, assumes block
     */ 
    updateIfs(key, value) {
        const expIfs = this.select(`*[exp-if="${key}"]`);

        expIfs.forEach(el => {
            el.style.display = (value ? "block" : "none");
        });
    }

    /* watch data model */
    watcher(model) {
        var that = this;
        Object.keys(model).forEach(key => {
            var value = model[key];

            /* define new setters and call updates */
            Object.defineProperty(that.model, key, {
                enumerable: true,
                get() {
                    return value;
                },
                set(val) {
                    value = val;
                    that.updateBindings(key, value);
                    that.updateModels(key, value);
                    that.updateIfs(key, value);
                    that.updateAttributes(key, value);
                }
            });

            that.model[key] = value;
        });
    }

    /* initial binding of input models */
    bindModels() {
        let selector = ["email", "number", "search", "tel", "text", "url", "checkbox", "radio"].map(input => {
            return `input[type="${input}"][exp-model]`;
        });
        selector = selector.concat(["textarea[exp-model]", "select[exp-model]"]);

        var inputs = this.select(selector.join());

        inputs.forEach(input => {
            const model = input.getAttribute("exp-model");
            const type = input.getAttribute("type");
            
            /* handle different input types */
            if (type === "checkbox") {
                input.addEventListener("change", event => {
                    this.model[model] = event.target.checked;
                });
            } else if (type === "radio") {
                input.addEventListener("change", event => {
                    this.model[model] = event.target.value;
                });
            } else {
                input.addEventListener("input", event => {
                    this.model[model] = event.target.value;
                });
            }
        });
    }

    updateAttributes(key, value) {
        let selector = this.supportedAttributes.map(attr => {
            return `*[exp-${attr}="${key}"]`;
        });
        const that = this;
        const elements = this.select(selector.join());

        elements.forEach(el => {
            this.supportedAttributes.forEach(attr => {
                var val = el.getAttribute('exp-' + attr);
                if (val === null || !(val in that.model)) return;
                
                el[attr] = that.model[val];
            })
        });
    }

    bindAttributes() {
        let selector = this.supportedAttributes.map(attr => {
            return `*[exp-${attr}]`;
        });
        const that = this;
        const elements = this.select(selector.join());
        elements.forEach(el => {
            this.supportedAttributes.forEach(attr => {
                var val = el.getAttribute('exp-' + attr);
                if (val === null || !(val in that.model)) return;
                
                el[attr] = that.model[val];
            })
        })
    }

    /* initial bindings of methods */
    bindMethods(template = undefined) {
        var that = this;
        let supportedEvents = ["click", "submit", "input", "hover", "blur", "focus", "mouseenter", "mouseleave"];
        let selector = supportedEvents.map(event => {
            return `*[exp-${event}]`;
        });

        var events = this.select(selector.join(), template);

        events.forEach(el => {
           supportedEvents.forEach(event => {
               var method = el.getAttribute('exp-' + event);
               if (method === null || !(method in that.methods)) return;

               el.addEventListener(event, function(e) {
                   that.methods[method].apply(that.model, [e]);
               });
           });
       });
    }

    bindAction() {
        let selector = `[exp-action]`;
        var elements = this.select(selector);
        elements.forEach(el => {
            el.addEventListener('click', (e) => {
                if (this.tracking && this.sdk !== null && this.context !== null) {
                    this.sdk.track('banner', this.getEventProperties('click'));
                }
            });
        })
    }

    bindRefs() {
        let selecor = `[exp-ref]`;
        var elements = this.select(selecor);
        elements.forEach(el => {
            let val = el.getAttribute('exp-ref');

            if (val && val !== '') {
                this.model.$refs[val] = el
            }
        });
    }

    bindClose() {
        let selector = `[exp-close]`;
        var elements = this.select(selector);
        elements.forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.removeBanner();
                /* track 'close' if tracking is set to true */
                if (this.tracking && this.sdk !== null && this.context !== null) {
                    this.sdk.track('banner', this.getEventProperties('close'));
                }
            });
        })
    }

    addAnimationClass(className = "exponea-animate") {
        if (this.app === null) return;
        if (this.app.classList) {
            this.app.classList.add(className);
        } else {
            this.app.className += ' ' + className;
        }
    }

    removeAnimationClass(className = "exponea-animate") {
        if (this.app === null) return;
        if (this.app.classList) {
            this.app.classList.remove(className);
        } else {
            this.app.className = this.app.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    }

    addBranding(color = "black"){
        if (this.app === null) return;
        var branding = document.createElement('object');
        var uuid = this.getUuid();
        this.app.appendChild(branding);
        branding.innerHTML = '<a href="https://exponea.com/?utm_campaign=exponea-web-layer&amp;utm_medium=banner&amp;utm_source=referral" e' + uuid + ' target="_blank">Powered by Exponea</a>';
        this.addStyle('[e' + uuid + ']{font-size:11px;position:absolute;color:' + color + ';opacity:.6;right:5px;bottom:5px;padding-top:0;text-decoration:none}[e' + uuid + ']:hover{opacity:.9}');
    }

    /**
     * helper selecor functions
     */
    listify(list) {
        return Array.prototype.slice.call(list);
    }

    select(selector, scope = this.app) {
        if (scope === null) return []
        var elements = this.listify(scope.querySelectorAll(selector));
        if (scope.matches(selector)) {
            elements.push(scope);
        }

        return elements;
    }
}

window.Exp = Exp;
