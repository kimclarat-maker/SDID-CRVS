var XMLHelper = (function () {
  const ElementNode = 1;
  const TextNode = 3;

  function _add(data, name, value) {
    if (value === "true") {
      value = true;
    } else if (value === "false") {
      value = false;
    }
    if (data[name]) {
      if (data[name].constructor != Array) {
        data[name] = [data[name]];
      }
      data[name][data[name].length] = value;
    } else {
      data[name] = value;
    }
  }

  function _parseAttributes(node, retval) {
    if (node.attributes != null) {
      for (var i = 0; i < node.attributes.length; i++) {
        var na = node.attributes[i];
        _add(retval, na.name, na.value);
      }
    }
  }

  function _parseChildNodes(node, retval) {
    if (node.childNodes != null) {
      for (var i = 0; i < node.childNodes.length; i++) {
        var cn = node.childNodes[i];
        if (cn.nodeType == ElementNode) {
          if (cn.childNodes.length == 0) {
            // empty node
            _add(retval, cn.nodeName, "");
          } else if (
            cn.childNodes.length == 1 &&
            cn.firstChild.nodeType == TextNode
          ) {
            _add(retval, cn.nodeName, cn.firstChild.nodeValue);
          } else {
            // recusrive call
            _add(retval, cn.nodeName, XMLHelper.xml2array(cn));
          }
        }
      }
    }
  }

  return {
    xml2array: function (node) {
      var data = {};
      _parseAttributes(node, data);
      _parseChildNodes(node, data);
      return data;
    },

    getXmlFromString: function (text) {
      try {
        var xmlDoc = null;
        if (window.DOMParser) {
          var parser = new DOMParser();
          xmlDoc = parser.parseFromString(text, "text/xml");
        } else if (window.ActiveXObject) {
          xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
          xmlDoc.async = false;
          xmlDoc.loadXML(text);
        }
        return xmlDoc;
      } catch (e) {
        alert(e);
      }
      return null;
    },
  };
})();
class Hourglass {
  constructor() {
    this.active = false;
  }

  show(timeoutCb, timeoutMs) {
    if (this.active === false) {
      this.active = true;
      var ovl = document.getElementById("BioCore-Overlay-L3");
      ovl.style.visibility = "visible";
      this.onTimeout = timeoutCb;
      this.timeoutMs = timeoutMs || 20000;
      var self = this;
      if (typeof this.onTimeout !== "undefined") {
        this.timeoutHandle = window.setTimeout(function () {
          self.onTimeout();
        }, this.timeoutMs);
      } else {
        this.timeoutHandle = undefined;
      }
    }
  }

  hide() {
    if (this.active === true) {
      if (typeof this.timeoutHandle !== "undefined") {
        window.clearTimeout(this.timeoutHandle);
      }
      var ovl = document.getElementById("BioCore-Overlay-L3");
      ovl.style.visibility = "hidden";
      this.active = false;
    }
  }
}
class DialogCtrl {
  constructor(dialogId, overlayId) {
    this.dialogId = dialogId;
    this.overlayId = overlayId;
    this.active = false;
  }

  show() {
    if (this.active === false) {
      this.active = true;
      var dlg = document.getElementById(this.dialogId);
      dlg.classList.add("BioCore-modal-open");
      dlg.classList.remove("BioCore-modal");

      var ovl = document.getElementById(this.overlayId);
      ovl.style.visibility = "visible";
    }
  }

  hide() {
    if (this.active === true) {
      var dlg = document.getElementById(this.dialogId);
      dlg.classList.add("BioCore-modal");
      dlg.classList.remove("BioCore-modal-open");
      var ovl = document.getElementById(this.overlayId);
      ovl.style.visibility = "hidden";
      this.active = false;
    }
  }
}
class ExceptionCtrl extends DialogCtrl {
  constructor(logRequestCb) {
    super("BioCore-Errors-Outer", "BioCore-Overlay-L5");
    this.requestLog = logRequestCb;
    var self = this;
    var btn = document.getElementById("BioCore-Btn-Accept");
    btn.addEventListener("click", function () {
      if (typeof self.next !== "undefined") {
        self.next();
      }
    });
    var coll = document.getElementsByClassName("BioCore-Panel-Collapsible");
    var i;
    for (i = 0; i < coll.length; i++) {
      coll[i].addEventListener("click", function () {
        this.classList.toggle("BioCore-Panel-Active");
        var content = this.nextElementSibling;
        if (content.style.display === "block") {
          content.style.display = "none";
        } else {
          content.style.display = "block";
        }
      });
    }
  }

  show(msgId, next, details) {
    if (this.active === false) {
      if (typeof details !== "undefined") {
        document
          .getElementById("BioCore-Exception-Details")
          .classList.remove("hidden");
        if (typeof details.Message !== "undefined") {
          document.getElementById(
            "BioCore-Exception-Message-Content"
          ).innerText = details.Message;
          document
            .getElementById("BioCore-Exception-Message-Line")
            .classList.remove("hidden");
        } else
          document
            .getElementById("BioCore-Exception-Message-Line")
            .setAttribute("class", "hidden");
        if (typeof details.Code !== "undefined") {
          document.getElementById("BioCore-Exception-Code-Content").innerText =
            details.Code;
          document
            .getElementById("BioCore-Exception-Code-Line")
            .classList.remove("hidden");
        } else
          document
            .getElementById("BioCore-Exception-Code-Line")
            .setAttribute("class", "hidden");
        if (typeof details.CallStack !== "undefined") {
          document.getElementById(
            "BioCore-Exception-CallStack-Content"
          ).innerText = details.CallStack;
          document
            .getElementById("BioCore-Exception-CallStack-Line")
            .classList.remove("hidden");
        } else
          document
            .getElementById("BioCore-Exception-CallStack-Line")
            .setAttribute("class", "hidden");
        if (typeof details.LogData !== "undefined") {
          document.getElementById(
            "BioCore-Exception-LogData-Content"
          ).innerText = details.LogData;
          document
            .getElementById("BioCore-Exception-LogData-Line")
            .classList.remove("hidden");
        } else
          document
            .getElementById("BioCore-Exception-LogData-Line")
            .setAttribute("class", "hidden");
      } else {
        var msg = document.getElementById("BioCore-Exception-Message");
        msg.classList.remove(...msg.classList);
        msg.classList.add(msgId);
      }
      this.next = next;
      var btn = document.getElementById("BioCore-Btn-Accept");
      if (typeof this.next !== "undefined") {
        btn.classList.remove("hidden");
      } else {
        btn.classList.add("hidden");
      }
      super.show();
    }
  }

  hide() {
    document
      .getElementById("BioCore-Exception-Message")
      .setAttribute("class", "hidden");
    document
      .getElementById("BioCore-Exception-Details")
      .setAttribute("class", "hidden");
    super.hide();
  }
}
class StatusCtrl extends DialogCtrl {
  constructor(impl) {
    super("BioCore-Status-Outer", "BioCore-Overlay-L4");
    this.biocore = impl;
    this.success = false;
    this.timeout = 0;
    this.lastStatusData = null;
    this.lastStatusUpdate = new Date();
    this.hidden = false;
    var self = this;
    document
      .getElementById("BioCore-Btn-StatusCancel")
      .addEventListener("click", function () {
        self.hide();
        if (self.success) {
          if (typeof self.onOk !== "undefined") self.onOk();
        } else {
          if (typeof self.onCancel !== "undefined") self.onCancel();
        }
      });
  }

  onStatus(status) {
    this.lastStatusData = status;
    this.lastStatusUpdate = new Date();
  }

  show(timeout, ok, cancel, hidden) {
    this.hidden = hidden || false;
    if (this.active === false) {
      this.timeout = timeout;
      this.onOk = ok;
      this.onCancel = cancel;
      this.success = false;
      document
        .getElementById("BioCore-Status-Connection")
        .setAttribute("class", "BioCore-Status-unchecked");
      document
        .getElementById("BioCore-Status-License")
        .setAttribute("class", "BioCore-Status-unchecked");
      document
        .getElementById("BioCore-Status-Device")
        .setAttribute("class", "BioCore-Status-unchecked");
      document
        .getElementById("BioCore-Status-Fingerprint")
        .setAttribute("class", "BioCore-Status-unchecked");
      document
        .getElementById("BioCore-Status-Face")
        .setAttribute("class", "BioCore-Status-unchecked");
      document
        .getElementById("BioCore-Status-Iris")
        .setAttribute("class", "BioCore-Status-unchecked");
      document
        .getElementById("BioCore-Status-Calibrating")
        .setAttribute("class", "BioCore-Status-unchecked");
      document
        .getElementById("BioCore-Status-Session")
        .setAttribute("class", "BioCore-Status-unchecked");
      if (!this.hidden) {
        super.show();
      }
      var self = this;
      window.setTimeout(function () {
        self.doChecks();
      }, 200);
    }
  }

  doChecks() {
    var item = document.getElementById("BioCore-Status-Connection");
    if (this.biocore.server.isInitiated()) {
      item.classList.remove("BioCore-Status-unchecked");
      item.classList.add("BioCore-Status-ok");
      this.evaluateStatus(this.lastStatusData);
    } else {
      item.classList.remove("BioCore-Status-unchecked");
      item.classList.add("BioCore-Status-error");
      if (this.hidden) {
        super.show();
      }
      this.handleError();
    }
  }

  evaluateStatus(statusData) {
    if (statusData === null || typeof statusData === "undefined") {
      this.handleError();
      return;
    } else {
      var failed = false;
      var item = document.getElementById("BioCore-Status-License");
      if (statusData.IsLicensed) {
        item.classList.remove("BioCore-Status-unchecked");
        item.classList.add("BioCore-Status-ok");
      } else {
        item.classList.remove("BioCore-Status-unchecked");
        item.classList.add("BioCore-Status-error");
        this.handleError();
        failed = true;
      }
      var hasDevice = false;
      item = document.getElementById("BioCore-Status-Fingerprint");
      item.classList.remove("BioCore-Status-unchecked");
      if (statusData.FingerprintDevice.Name !== "") {
        item.classList.add("BioCore-Status-yes");
        hasDevice = true;
      } else {
        item.classList.add("BioCore-Status-no-ok");
      }
      item = document.getElementById("BioCore-Status-Face");
      item.classList.remove("BioCore-Status-unchecked");
      if (statusData.FaceDevice.Name !== "") {
        item.classList.add("BioCore-Status-yes");
        hasDevice = true;
      } else {
        item.classList.add("BioCore-Status-no-ok");
      }
      item = document.getElementById("BioCore-Status-Iris");
      item.classList.remove("BioCore-Status-unchecked");
      if (statusData.IrisDevice.Name !== "") {
        item.classList.add("BioCore-Status-yes");
        hasDevice = true;
      } else {
        item.classList.add("BioCore-Status-no-ok");
      }
      item = document.getElementById("BioCore-Status-Device");
      if (!hasDevice) {
        item.classList.remove("BioCore-Status-unchecked");
        item.classList.add("BioCore-Status-error");
        this.handleError();
        failed = true;
      } else {
        item.classList.remove("BioCore-Status-unchecked");
        item.classList.add("BioCore-Status-ok");
      }
      item = document.getElementById("BioCore-Status-Session");
      if (statusData.IsSessionActive) {
        if (statusData.OwnActiveSession) {
          item.classList.remove("BioCore-Status-unchecked");
          item.classList.add("BioCore-Status-acquired");
        } else {
          item.classList.remove("BioCore-Status-unchecked");
          item.classList.add("BioCore-Status-error");
          this.handleError();
          failed = true;
        }
      } else {
        item.classList.remove("BioCore-Status-unchecked");
        item.classList.add("BioCore-Status-available");
      }
      item = document.getElementById("BioCore-Status-Ready");
      if (statusData.IsReady) {
        item.classList.remove("BioCore-Status-unchecked");
        item.classList.add("BioCore-Status-ok");
      } else {
        item.classList.remove("BioCore-Status-unchecked");
        item.classList.add("BioCore-Status-notready");
        this.handleError();
        failed = true;
      }
      var item = document.getElementById("BioCore-Status-Calibrating");
      if (!statusData.IsCalibrating) {
        item.classList.remove("BioCore-Status-unchecked");
        item.classList.add("BioCore-Status-yes");
      } else {
        item.classList.remove("BioCore-Status-unchecked");
        item.classList.add("BioCore-Status-no");
        this.handleError();
        failed = true;
      }
      if (failed) {
        if (this.hidden) {
          super.show();
        }
        return;
      }
      this.success = true;
      var self = this;
      window.setTimeout(function () {
        self.hide();
        if (typeof self.onOk !== "undefined") self.onOk();
      }, self.timeout || 3000);
    }
  }

  handleError() {}
}
class AnnotationsCtrl extends DialogCtrl {
  constructor(startAnnotatedCb, cancelCb, resumeWithDecisionCb) {
    super("BioCore-Annotation-Outer", "BioCore-Overlay-L1");
    this.resumeCb = resumeWithDecisionCb;
    this.taskItemInContext = null;
    this.menuState = 0;
    this.labelState = 0;
    this.taskItemClassName = "Annotation-Item";
    this.contextListener();
    this.clickListener();
    this.keyupListener();
    this.resizeListener();
    this.hoverListener();
    var self = this;
    document
      .getElementById("BioCore-Btn-Reset")
      .addEventListener("click", function () {
        self.resetAnnotation();
      });
    document
      .getElementById("BioCore-Btn-StartCollection")
      .addEventListener("click", function () {
        var annotation = self.getAnnotations();
        startAnnotatedCb(annotation);
      });
    document
      .getElementById("BioCore-Btn-Cancel")
      .addEventListener("click", function () {
        cancelCb();
      });
  }

  setRequest(request) {
    var elem = document.getElementById("BioCore-Annotation-SupportedDecisions");
    elem.innerHTML = "";
    var self = this;
    request.SupportedDecisions.SupportedDecision.forEach((element) => {
      var item = document.createElement("div");
      item.setAttribute("class", "BioCore-Btn");
      item.setAttribute("data-id", element);
      item.classList.add(element);
      elem.appendChild(item);
      item.addEventListener("click", function (e) {
        e.preventDefault();
        var el = e.srcElement || e.target;
        self.resumeCb(el.getAttribute("data-id"));
      });
    });
  }

  clearList() {
    var elem = document.getElementById("BioCore-Annotation-SupportedDecisions");
    elem.innerHTML = "";
  }

  contextListener() {
    var elem = document.getElementById("BioCore-Annotation");
    var self = this;
    elem.addEventListener("click", function (e) {
      var before = self.taskItemInContext;
      self.taskItemInContext = self.clickInsideElement(
        e,
        self.taskItemClassName
      );
      if (self.taskItemInContext) {
        e.preventDefault();
        e.done = true;
        self.toggleMenuOn();
        self.positionElement(
          e,
          document.getElementById("BioCore-Annotation-ContextMenu"),
          0
        );
      } else if (
        typeof self.clickInsideElement(e, "menu-item-link") !== "undefined"
      ) {
        self.taskItemInContext = before;
      } else {
        self.taskItemInContext = null;
        self.toggleMenuOff();
      }
    });
  }

  clickListener() {
    var elem = document.getElementById("BioCore-Annotation");
    var self = this;
    elem.addEventListener("click", function (e) {
      if (typeof e.done === "undefined") {
        var clickeElIsLink = self.clickInsideElement(e, "menu-item-link");
        if (clickeElIsLink) {
          e.preventDefault();
          self.menuItemListener(clickeElIsLink);
        } else {
          var button = e.which || e.button;
          if (button === 1) {
            self.toggleMenuOff();
          }
        }
      }
    });
  }

  keyupListener() {
    var self = this;
    window.onkeyup = function (e) {
      if (e.keyCode === 27) {
        self.toggleMenuOff();
      }
    };
  }

  resizeListener() {
    var self = this;
    window.onresize = function (e) {
      self.toggleMenuOff();
    };
  }

  hoverListener() {
    var elem = document.getElementById("BioCore-Annotation");
    var self = this;
    elem.addEventListener(
      "mousemove",
      function (e) {
        var item = self.clickInsideElement(e, self.taskItemClassName);
        if (item && self.menuState === 0) {
          e.preventDefault();
          if (!item.classList.contains("deactivated")) {
            var label = document.getElementById("Annotation-Label");
            label.classList.remove(...label.classList);
            label.classList.add(
              "Annotation-Label-" + item.getAttribute("data-id")
            );
            if (self.labelState === 1) label.classList.add("label-active");
            for (var i = 0; i <= 4; i++) {
              if (item.classList.contains("BioCore-Annotation" + i))
                label.classList.add("BioCore-Annotation" + i);
            }
            self.toggleLabelOn();
            self.positionElement(
              e,
              document.getElementById("Annotation-Label"),
              10
            );
          }
        } else if (
          item &&
          self.menuState === 1 &&
          item != self.taskItemInContext
        ) {
          self.taskItemInContext = null;
          self.toggleMenuOff();
          self.toggleLabelOff();
        } else {
          self.toggleLabelOff();
        }
      },
      false
    );
  }

  getAnnotations() {
    var elem = document.getElementById("BioCore-Annotation");
    var x = elem.getElementsByClassName("Annotation-Item");
    var data = [];
    for (var i = 0; i < x.length; i++) {
      if (
        x[i].classList.contains("BioCore-Annotation0") ||
        x[i].classList.contains("deactivated")
      )
        continue;
      data.push({
        Reason: x[i].getAttribute("data-annotation"),
        Info: "",
        Modality: 4,
        Position: parseInt(x[i].getAttribute("data-pos")),
      });
    }
    return data;
  }

  resetAnnotation() {
    var elem = document.getElementById("BioCore-Annotation");
    var x = elem.getElementsByClassName("Annotation-Item");
    for (var i = 0; i < x.length; i++) {
      if (
        x[i].classList.contains("BioCore-Annotation0") ||
        x[i].classList.contains("deactivated")
      )
        continue;
      x[i].setAttribute("data-annotation", "NotAnnotated");
      this.clearItem(x[i]);
      x[i].classList.add("BioCore-Annotation0");
    }
  }

  clickInsideElement(e, className) {
    var el = e.srcElement || e.target;
    if (el.classList.contains(className)) {
      return el;
    } else {
      while ((el = el.parentNode)) {
        if (el.classList && el.classList.contains(className)) {
          return el;
        }
      }
    }
    return false;
  }

  getPosition(e) {
    console.log("I am the boss");
    var posx = 0;
    var posy = 0;
    if (!e) var e = window.event;
    if (e.pageX || e.pageY) {
      posx = e.pageX;
      posy = e.pageY;
    } else if (e.clientX || e.clientY) {
      posx =
        e.clientX +
        document.body.scrollLeft +
        document.documentElement.scrollLeft;
      posy =
        e.clientY +
        document.body.scrollTop +
        document.documentElement.scrollTop;
    }
    return {
      x: posx,
      y: posy,
    };
  }

  show() {
    document.getElementById("BioCore-Annotation-Buttons").style.display =
      "block";
    document.getElementById(
      "BioCore-Annotation-SupportedDecisions"
    ).style.display = "none";
    super.show();
  }

  showSecondary() {
    document.getElementById("BioCore-Annotation-Buttons").style.display =
      "none";
    document.getElementById(
      "BioCore-Annotation-SupportedDecisions"
    ).style.display = "block";
    super.show();
  }

  toggleMenuOn() {
    var menu = document.getElementById("BioCore-Annotation-ContextMenu");
    if (this.menuState !== 1) {
      this.menuState = 1;
      menu.classList.add("menu-active");
    }
  }

  toggleMenuOff() {
    var menu = document.getElementById("BioCore-Annotation-ContextMenu");
    if (this.menuState !== 0) {
      this.menuState = 0;
      menu.classList.remove("menu-active");
    }
  }

  toggleLabelOn() {
    var label = document.getElementById("Annotation-Label");
    if (this.labelState !== 1) {
      this.labelState = 1;
      label.classList.add("label-active");
    }
  }

  toggleLabelOff() {
    var label = document.getElementById("Annotation-Label");
    if (this.labelState !== 0) {
      this.labelState = 0;
      label.classList.remove("label-active");
    }
  }

  positionElement(e, elem, d) {
    var clickCoords = this.getPosition(e);
    var clickCoordsX = clickCoords.x;
    var clickCoordsY = clickCoords.y;

    var width = elem.offsetWidth + 20;
    var height = elem.offsetHeight + 4;

    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;

    if (windowWidth - clickCoordsX < width) {
      elem.style.left = windowWidth - width + d + "px";
    } else {
      elem.style.left = clickCoordsX + d + "px";
    }

    if (windowHeight - clickCoordsY < height) {
      elem.style.top = windowHeight - height + d + "px";
    } else {
      elem.style.top = clickCoordsY + d + "px";
    }
  }

  clearItem(item) {
    for (var i = 0; i <= 4; i++) {
      if (item.classList.contains("BioCore-Annotation" + i)) {
        item.classList.remove("BioCore-Annotation" + i);
      }
    }
  }

  menuItemListener(link) {
    if (!this.taskItemInContext.classList.contains("deactivated")) {
      this.clearItem(this.taskItemInContext);
      this.taskItemInContext.classList.add(
        "BioCore-Annotation" + link.getAttribute("data-action")
      );
      this.taskItemInContext.setAttribute(
        "data-annotation",
        link.getAttribute("data-annotation")
      );
    }
    this.toggleMenuOff();
  }
}
class CaptureCtrl extends DialogCtrl {
  constructor(stopCb, forceCb, startedCb, addressCb) {
    super("BioCore-Capture-Outer", "BioCore-Overlay-L0");
    document
      .getElementById("BioCore-Btn-StopCollection")
      .addEventListener("click", stopCb);
    document
      .getElementById("BioCore-Btn-ForceCollection")
      .addEventListener("click", forceCb);
    this.onStarted = startedCb;
    this.getQualifiedUri = addressCb;
    this.capturing = false;
  }

  show() {
    this.capturing = false;
    super.show();
  }

  hide() {
    super.hide();
    this.deleteImage();
    this.capturing = false;
  }

  setFingerprintInfo(pos, imp, qualityInd) {
    var elemActivePosition = document.getElementById("BioCore-ActivePosition");
    elemActivePosition.setAttribute("class", "");
    elemActivePosition.classList.add("PositionFinger" + pos);
    elemActivePosition.classList.add("ImpressionFinger" + imp);
    if (qualityInd != undefined) {
      var dPositionQualityInd = qualityInd.QualityIndicator;
      console.log("dPositionQualityInd", dPositionQualityInd);
      if (typeof dPositionQualityInd !== "string") {
        for (
          var dCounter = 0;
          dCounter < dPositionQualityInd.length;
          dCounter++
        ) {
          var elemQualityIndicator = document.getElementById(
            "BioCore-QualityIndicator" + dCounter
          );
          elemQualityIndicator.setAttribute(
            "class",
            "BioCore-Quality" + dPositionQualityInd[dCounter]
          );
        }
      } else {
        var elemQualityIndicator = document.getElementById(
          "BioCore-QualityIndicator0"
        );
        elemQualityIndicator.setAttribute(
          "class",
          "BioCore-Quality" + dPositionQualityInd
        );
      }
    } else {
      this.clearIndicators("FROM:else setfingerprinInfo");
    }
  }

  setFaceInfo(pos, imp) {
    var elemActivePosition = document.getElementById("BioCore-ActivePosition");
    elemActivePosition.setAttribute("class", "");
    elemActivePosition.classList.add("PositionFace" + pos);
    elemActivePosition.classList.add("ImpressionFace" + imp);
  }

  setIrisInfo(pos, imp) {
    var arrPos = new Array();
    var impPos = new Array();
    document.getElementById("ActivePosition").value = arrPos[parseInt(pos)];
    //document.getElementById("ActiveImpression").value = arrImp[parseInt(imp)];
  }

  clearIndicators(from) {
    for (var dCounter = 0; dCounter <= 4; dCounter++) {
      var elemQualityIndicator = document.getElementById(
        "BioCore-QualityIndicator" + dCounter
      );
      elemQualityIndicator.setAttribute("class", "");
    }
  }

  deleteInfo() {
    var elemActivePosition = document.getElementById("BioCore-ActivePosition");
    elemActivePosition.setAttribute("class", "");
    this.clearIndicators("FROM:deleteInfo");
  }

  createImage(width, height) {
    const elemCanvas = document.getElementById("BioCore-Preview-Canvas");
    const img = document.getElementById("BioCore-Preview");

    if (img) {
      // If dimensions match, do nothing
      if (img.width === width && img.height === height) {
        return;
      }

      // Update dimensions directly instead of recreating
      img.width = width;
      img.height = height;
    } else {
      // Create new image if it doesn't exist
      const newImg = document.createElement("img");
      newImg.id = "BioCore-Preview";
      newImg.width = width;
      newImg.height = height;
      newImg.alt = "?";
      newImg.className = "border";

      // Optional: Set a default transparent pixel if needed
      newImg.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

      // Append to canvas container
      elemCanvas.innerHTML = "";
      elemCanvas.appendChild(newImg);
      console.log("Created new image:", width, height);
    }
  }
  // createImage(width, height) {
  //   var elemCanvas = document.getElementById("BioCore-Preview-Canvas");
  //   var img = document.getElementById("BioCore-Preview");
  //   if (img != null) {
  //     if (img.width != width || img.height != height) {
  //       this.deleteImage();
  //       this.createImage(width, height);
  //     }
  //   } else {
  //     var html =
  //       "<img id='BioCore-Preview' width='" +
  //       width +
  //       "' height='" +
  //       height +
  //       "' alt='?' class='border'/>";
  //     elemCanvas.innerHTML = html;
  //   }
  // }

  deleteImage() {
    var elemCanvas = document.getElementById("BioCore-Preview-Canvas");
    elemCanvas.innerHTML = null;
    this.deleteInfo();
  }

  onPreview(preview, next) {
    if (preview != "") {
      if (preview.Active != null) {
        switch (parseInt(preview.Active.Modality)) {
          case 4:
            this.setFingerprintInfo(
              preview.Active.Position,
              preview.Active.Impression,
              preview.QualityIndicators
            );
            break;
          case 5:
            this.setFaceInfo(
              preview.Active.Position,
              preview.Active.Impression
            );
            break;
          case 6:
            this.setIrisInfo(
              preview.Active.Position,
              preview.Active.Impression
            );
            break;
        }
        if (this.capturing === false) {
          this.capturing = true;
          if (typeof this.onStarted !== "undefined") {
            console.log("onStarted finger print device");
            this.onStarted();
          }
        }
      } else {
        console.log("FROM deleteInfo review.Active != null");
        this.deleteInfo();
      }
      if (preview.Image != null) {
        var max_w =
          window.innerWidth ||
          document.documentElement.clientWidth ||
          document.body.clientWidth;
        var max_h =
          window.innerHeight ||
          document.documentElement.clientHeight ||
          document.body.clientHeight;
        max_w = max_w * 0.8;
        max_h = max_h - 300;
        var test = Math.ceil(
          (preview.Image.Height * max_w) / preview.Image.Width
        );
        if (test <= max_h) {
          this.createImage(Math.ceil(max_w), test);
        } else {
          test = Math.ceil(
            (preview.Image.Width * max_h) / preview.Image.Height
          );
          this.createImage(test, Math.ceil(max_h));
        }
        if (
          typeof preview.Image.ImageUri !== "undefined" &&
          preview.Image.ImageUri !== null &&
          preview.Image.ImageUri !== ""
        ) {
          var elemPreview = document.getElementById("BioCore-Preview");
          elemPreview.onload = elemPreview.onabort = elemPreview.onerror = next; // triggers a new preview after the image loads
          elemPreview.src = this.getQualifiedUri(preview.Image.ImageUri);
          return null;
        }
      } else {
        if (preview.QualityIndicators != null) {
          console.log("FROM preview.QualityIndicators != null");
          this.deleteInfo();
        }
      }
    } else {
      this.deleteInfo();
    }
    next();
    return null;
  }
}
class DecisionsCtrl extends DialogCtrl {
  constructor(decisionCb) {
    super("BioCore-Decisions-Outer", "BioCore-Overlay-L2");
    this.decisionCb = decisionCb;
  }

  setRequest(request) {
    var elem = document.getElementById("BioCore-Box-SupportedDecisions");
    elem.innerHTML = "";
    var self = this;

    request.SupportedDecisions.SupportedDecision.forEach((element) => {
      var item = document.createElement("div");
      item.setAttribute("class", "BioCore-Btn");
      item.setAttribute("data-id", element);
      item.classList.add(element);
      elem.appendChild(item);

      item.addEventListener("click", function (e) {
        e.preventDefault();
        var el = e.srcElement || e.target;
        self.decisionCb(el.getAttribute("data-id"));
      });
    });

    document
      .getElementById("BioCore-Content-Step")
      .setAttribute("class", request.ProcStep);
    document
      .getElementById("BioCore-Content-Code")
      .setAttribute("class", request.RequestCode);

    // 🔹 Hide confirm + abort buttons + mark title red if enumSwitchedHands exists
    function applySwitchedHandsRules() {
      const table = document.getElementById("BioCore-Interaction-Table");
      const title = document.getElementById("BioCore-Interaction-Title");

      const bioCoreErrors = [
        "enumGeneric Error",
        "enumShiftedOrSmeared",
        "enumClearCaptureArea",
        "enumPresentationAttackDetected",
        "enumMissingBiometrics",
        "enumTooManyBiometrics",
        "enumNotFitInFinal",
        "enumRollToSlapRatioToSmall",
        // "enumLowQuality",
        // "enumTooFewFeatures",
        // "enumWrongControlThumbs",
        // "enumWrongControlFingers",
        // "enumMissingControlFingers",
        "enumForeignFinger",
        "enumSwitchedFingers",
        "enumSwitchedHands",
        "enumDoubledFinger",
        "enumComplianceWarning",
        "enumNotVerified",
        "enumLowConfidence",
        "enumCompressionRatioWarning"
      ];

      if (table) {
        const hasError = bioCoreErrors.some((error) =>
          table.querySelector(`.${error}`)
        );

        if (hasError) {
          // Hide buttons
          const buttonsToHide = document.querySelectorAll(
            "#BioCore-Box-SupportedDecisions .BioCore-Btn.enumConfirmResult, " +
              "#BioCore-Box-SupportedDecisions .BioCore-Btn.enumAbortWorkflow"
          );
          buttonsToHide.forEach((btn) => {
            btn.style.setProperty("display", "none", "important");
          });

          // Set title background red
          if (title) {
            title.style.setProperty("background-color", "red", "important");
          }
        }
      }
    }

    // Run immediately
    applySwitchedHandsRules();

    // 🔹 Observe table for changes
    const table = document.getElementById("BioCore-Interaction-Table");
    if (table) {
      const observer = new MutationObserver(() => {
        applySwitchedHandsRules();
      });

      observer.observe(table, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }
  }

  clearList() {
    var elem = document.getElementById("BioCore-Box-SupportedDecisions");
    elem.innerHTML = "";
  }

  clearList() {
    var elem = document.getElementById("BioCore-Box-SupportedDecisions");
    elem.innerHTML = "";
  }

  clearList() {
    var elem = document.getElementById("BioCore-Box-SupportedDecisions");
    elem.innerHTML = "";
  }
}
var Base64 = (function () {
  var encodings =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  return {
    fromArrayBuffer: function (arrayBuffer) {
      var base64 = "";
      var bytes = new Uint8Array(arrayBuffer);
      var byteLength = bytes.byteLength;
      var byteRemainder = byteLength % 3;
      var mainLength = byteLength - byteRemainder;
      var a, b, c, d;
      var chunk;
      // Main loop deals with bytes in chunks of 3
      for (var i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
        c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
        d = chunk & 63; // 63       = 2^6 - 1
        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
      }

      // Deal with the remaining bytes and padding
      if (byteRemainder == 1) {
        chunk = bytes[mainLength];
        a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2
        // Set the 4 least significant bits to zero
        b = (chunk & 3) << 4; // 3   = 2^2 - 1
        base64 += encodings[a] + encodings[b] + "==";
      } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
        a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4
        // Set the 2 least significant bits to zero
        c = (chunk & 15) << 2; // 15    = 2^4 - 1
        base64 += encodings[a] + encodings[b] + encodings[c] + "=";
      }
      return base64;
    },
  };
})();
class BioCoreSocket {
  constructor(server, protocol, id, path) {
    this.server = server;
    this.id = id;
    this.protocol = protocol;
    this.path = path || "";
    this.socket = this.openWs(this.getWsUrl(this.path, this.id), this.protocol);
    var self = this;
    this.socket.onmessage = function (msg) {
      if (typeof self.onmessage !== "undefined") {
        self.onmessage(msg);
      }
      if (typeof self.next !== "undefined") {
        self.next(msg);
        self.next = undefined;
      }
    };
  }

  getWsUrl(extra_url, query) {
    var pcol;
    var u = this.server || document.URL;
    if (u.substring(0, 4) == "file") {
      pcol = "wss://";
      u = "localhost:7745";
    } else if (u.substring(0, 5) == "https") {
      pcol = "wss://";
      u = u.substr(8);
    } else {
      pcol = "ws://";
      if (u.substring(0, 4) == "http") u = u.substr(7);
    }
    u = u.split("/");
    return pcol + u[0] + "/" + extra_url + "?" + query;
  }

  openWs(urlpath, protocol) {
    if (typeof MozWebSocket != "undefined") {
      return new MozWebSocket(urlpath, protocol);
    }
    return new WebSocket(urlpath, protocol);
  }

  isOpen() {
    return this.socket.readyState === 1;
  }

  send(msg, next) {
    this.next = next;
    this.socket.send(msg);
  }
}
class WebSocketClient {
  constructor(
    server,
    cnt,
    suffix,
    exceptionCb,
    statusCb,
    previewCb,
    envCb,
    resultCb
  ) {
    // callbacks
    this.onException = exceptionCb;
    this.onStatus = statusCb;
    this.onPreview = previewCb;
    this.onEnvironment = envCb;
    this.onResult = resultCb;
    // general
    this.browserId = new Date().valueOf();
    this.server = server;
    this.lastPreview = new Date();
    // create sockets
    var self = this;
    this.socketStatus = new BioCoreSocket(
      this.server,
      "STATUS-QUERY-" + suffix,
      this.browserId
    );
    this.socketStatus.onmessage = function (msg) {
      self.onResponse(msg);
    };
    this.socketEnvironment = new BioCoreSocket(
      this.server,
      "ENVIRONMENT-QUERY-" + suffix,
      this.browserId
    );
    this.socketEnvironment.onmessage = function (msg) {
      self.onResponse(msg);
    };
    this.socketPreview = new BioCoreSocket(
      this.server,
      "PREVIEW-QUERY-" + suffix,
      this.browserId
    );
    this.socketPreview.onmessage = function (msg) {
      self.onResponse(msg);
    };
    this.socketWorkflowRegister = new BioCoreSocket(
      this.server,
      "WORKFLOW-REGISTER-" + suffix,
      this.browserId
    );
    this.socketWorkflowRegister.onmessage = function (msg) {
      self.onResponse(msg);
    };
    this.socketCollectionStart = new BioCoreSocket(
      this.server,
      "COLLECTION-START-" + suffix,
      this.browserId
    );
    this.socketCollectionStart.onmessage = function (msg) {
      self.onResponse(msg);
    };
    this.socketCollectionAnnotation = new BioCoreSocket(
      this.server,
      "COLLECTION-ANNOTATION-" + suffix,
      this.browserId
    );
    this.socketCollectionAnnotation.onmessage = function (msg) {
      self.onResponse(msg);
    };
    this.socketCollectionInteract = new BioCoreSocket(
      this.server,
      "COLLECTION-INTERACT-" + suffix,
      this.browserId
    );
    this.socketCollectionInteract.onmessage = function (msg) {
      self.onResponse(msg);
    };
    this.socketCollectionPerson = new BioCoreSocket(
      this.server,
      "COLLECTION-PERSON-" + suffix,
      this.browserId
    );
    this.socketCollectionPerson.onmessage = function (msg) {
      self.onResponse(msg);
    };
    this.socketCollectionReset = new BioCoreSocket(
      this.server,
      "COLLECTION-RESET-" + suffix,
      this.browserId
    );
    this.socketCollectionReset.onmessage = function (msg) {
      self.onResponse(msg);
    };
    this.socketCollectionForce = new BioCoreSocket(
      this.server,
      "COLLECTION-FORCE-" + suffix,
      this.browserId
    );
    this.socketCollectionForce.onmessage = function (msg) {
      self.onResponse(msg);
    };
    this.socketCollectionStop = new BioCoreSocket(
      this.server,
      "COLLECTION-STOP-" + suffix,
      this.browserId
    );
    this.socketCollectionStop.onmessage = function (msg) {
      self.onResponse(msg);
    };
    this.socketCollectionLog = new BioCoreSocket(
      this.server,
      "COLLECTION-LOG-" + suffix,
      this.browserId
    );
    this.socketCollectionLog.onmessage = function (msg) {
      self.onResponse(msg);
    };
    this.vipSockets = new Array();
    this.vipSockets.push(this.socketStatus);
    this.vipSockets.push(this.socketPreview);
    this.vipSockets.push(this.socketCollectionAnnotation);
    this.vipSockets.push(this.socketCollectionStart);
    // first status query
    this.whenInitiated(self, function () {
      self.queryStatus();
    });
  }

  isInitiated() {
    var missing = this.vipSockets.filter(function (socket) {
      return socket.isOpen() === false;
    });
    return missing.length === 0;
  }

  whenInitiated(self, doNext) {
    if (!self.isInitiated()) {
      window.setTimeout(function () {
        self.whenInitiated(self, doNext);
      }, 100);
    } else {
      doNext();
    }
  }

  onResponse(msg) {
    var arr = this.getResponse(msg);
    if (arr.ExceptionData != null) {
      this.onException(arr.ExceptionData);
    } else if (arr.Status != null) {
      this.onStatus(arr.Status);
    } else if (arr.Preview != null) {
      this.lastPreview = new Date();
      this.onPreview(arr.Preview);
    } else if (arr.EnvironmentData != null) {
      this.onEnvironment(arr.EnvironmentData);
    } else if (arr.CollectionStatus != null) {
      this.onCollectionStatus(arr.CollectionStatus);
    } else if (arr.PersonData != null) {
      this.onResult(arr.PersonData);
    }
  }

  whenSessionOpened = function (doNext) {
    // dummy function to be compatible with RESTful
    doNext();
  };

  getQualifiedUri(uri) {
    return this.server + uri;
  }

  queryStatus(timeout, next) {
    if (this.socketStatus != null && this.socketStatus.isOpen()) {
      this.socketStatus.send("", next);
    }
  }

  queryEnvironment() {
    if (this.socketEnvironment != null && this.socketEnvironment.isOpen()) {
      this.socketEnvironment.send("");
    }
  }

  getAnnotations() {
    this.socketCollectionAnnotation.send("");
  }

  downloadPersonData() {
    this.socketCollectionPerson.send("");
  }

  resetCollection(next) {
    try {
      this.socketCollectionReset.send("", next);
    } catch (e) {
      console.log(e);
    }
  }

  forceCollection() {
    this.socketCollectionForce.send("");
  }

  stopCollection() {
    this.socketCollectionStop.send("");
  }
}
class WebSocketXml extends WebSocketClient {
  constructor(server, cnt, exceptionCb, statusCb, previewCb, envCb, resultCb) {
    super(
      server,
      cnt,
      "XML",
      exceptionCb,
      statusCb,
      previewCb,
      envCb,
      resultCb
    );
  }

  getResponse(msg) {
    return XMLHelper.xml2array(XMLHelper.getXmlFromString(msg.data));
  }

  queryStatus(timeout, next) {
    var self = this;
    super.queryStatus(timeout, function (msg) {
      if (typeof next === "function") {
        next(self.getResponseData(msg));
      }
    });
  }

  registerWorkflow(workflow, next) {
    this.socketWorkflowRegister.send(workflow, next);
    var arr = XMLHelper.xml2array(XMLHelper.getXmlFromString(workflow));
    return arr.Workflow.Name;
  }

  startCollection(name) {
    var content = "<WorkflowName>" + name + "</WorkflowName>";
    this.socketCollectionStart.send(content);
  }

  setAnnotations(annotation) {
    var xml = "";
    annotation.forEach(function (item) {
      xml +=
        "<Annotation><Reason>" +
        item.Reason +
        "</Reason><Info>" +
        item.Info +
        "</Info><Modality>" +
        item.Modality +
        "</Modality><Position>" +
        item.Position +
        "</Position></Annotation>";
    });
    var env = "<Annotations>" + xml + "</Annotations>";
    this.socketCollectionAnnotation.send(env);
  }

  sendUserDecision(choice) {
    var content = "<UserResponse>" + choice + "</UserResponse>";
    this.socketCollectionInteract.send(content);
  }

  queryLogs(next) {
    var self = this;
    this.socketCollectionLog.send("", function (msg) {
      if (typeof next === "function") {
        next(self.getResponseData(msg));
      }
    });
  }
}
class WebSocketJson extends WebSocketClient {
  constructor(server, cnt, exceptionCb, statusCb, previewCb, envCb, resultCb) {
    super(
      server,
      cnt,
      "JSON",
      exceptionCb,
      statusCb,
      previewCb,
      envCb,
      resultCb
    );
  }

  getResponse(msg) {
    return JSON.parse(msg.data);
  }

  queryStatus(timeout, next) {
    var self = this;
    super.queryStatus(timeout, function (msg) {
      if (typeof next === "function") {
        next(self.getResponseData(msg));
      }
    });
  }

  registerWorkflow(workflow, next) {
    this.socketWorkflowRegister.send(workflow, next);
    var arr = JSON.parse(workflow);
    return arr.Workflow.Name;
  }

  startCollection(name) {
    var json = '{"WorkflowName":"' + name + '"}';
    this.socketCollectionStart.send(json);
  }

  setAnnotations(annotation) {
    var json = JSON.stringify({ Annotations: { Annotation: annotation } });
    this.socketCollectionAnnotation.send(json);
  }

  sendUserDecision(choice) {
    var json = '{"UserResponse":"' + choice + '"}';
    this.socketCollectionInteract.send(json);
  }

  queryLogs(next) {
    var self = this;
    this.socketCollectionLog.send("", function (msg) {
      if (typeof next === "function") {
        next(self.getResponseData(msg));
      }
    });
  }
}
class RestfulClient {
  constructor(server, exceptionCb, statusCb, previewCb, envCb, resultCb) {
    // callbacks
    this.onException = exceptionCb;
    this.onStatus = statusCb;
    this.onPreview = previewCb;
    this.onEnvironment = envCb;
    this.onResult = resultCb;
    // general
    this.browserId = new Date().valueOf();
    this.session = "";
    this.server = server;
    this.lastPreview = new Date();
    this.initiated = false;
    // start
    this.queryStatus(0);
    this.queryPreview(0);
  }

  isInitiated() {
    return this.initiated;
  }

  getAjaxObject(url, method, callback, contentType) {
    try {
      if (
        navigator.appName == "Microsoft Internet Explorer" &&
        top.location.protocol != "file:"
      ) {
        var xDomain = new XDomainRequest();
        if (callback != null) {
          xDomain.onload = function () {
            callback(xDomain);
          };
        }
        xDomain.open(method, url);
        return xDomain;
      } else {
        var xmlHttp = new XMLHttpRequest();
        if (callback != null) {
          xmlHttp.onreadystatechange = function () {
            callback(xmlHttp);
          };
        }
        xmlHttp.open(method, url, true);
        if (contentType != null) {
          xmlHttp.setRequestHeader("Content-type", contentType);
        }
        return xmlHttp;
      }
    } catch (e) {
      alert(e);
    }
  }

  onResponse(ajax) {
    var arr = this.getResponse(ajax);
    if (arr !== null) {
      this.initiated = true;
      if (arr.ExceptionData != null) {
        this.onException(arr.ExceptionData.Message);
      } else if (arr.SessionId != null) {
        this.session = arr.SessionId;
      } else if (typeof arr.Status !== "undefined") {
        if (arr.Status !== null && arr.Status !== "") {
          var self = this;
          this.onStatus(arr.Status, function () {
            self.queryStatus(5);
          });
        } else {
          this.queryStatus(5);
        }
      } else if (typeof arr.Preview !== "undefined") {
        this.lastPreview = new Date();
        if (arr.Preview !== null && arr.Preview !== "") {
          var self = this;
          this.onPreview(arr.Preview, function () {
            self.queryPreview(5);
          });
        } else {
          this.queryPreview(5);
        }
      } else if (
        typeof arr.EnvironmentData !== "undefined" &&
        arr.EnvironmentData !== null &&
        arr.EnvironmentData !== ""
      ) {
        this.onEnvironment(arr.EnvironmentData);
      } else if (
        typeof arr.CollectionStatus !== "undefined" &&
        arr.CollectionStatus !== null &&
        arr.CollectionStatus !== ""
      ) {
        this.onCollectionStatus(arr.CollectionStatus);
      } else if (
        typeof arr.PersonData !== "undefined" &&
        arr.PersonData !== null &&
        arr.PersonData !== ""
      ) {
        this.onResult(arr.PersonData);
      }
    }
  }

  whenSessionOpened = function (doNext) {
    var self = this;
    if (
      this.session == undefined ||
      this.session === null ||
      this.session === ""
    ) {
      window.setTimeout(function () {
        self.whenSessionOpened(doNext);
      }, 100);
    } else {
      doNext();
    }
  };

  getQualifiedUri(uri) {
    return this.server + uri + this.session;
  }
}
class RestfulXml extends RestfulClient {
  constructor(server, exceptionCb, statusCb, previewCb, envCb, resultCb) {
    super(server, exceptionCb, statusCb, previewCb, envCb, resultCb);
  }

  postRequest(path, query, content, responseCb) {
    var method = content.length > 0 ? "POST" : "GET";
    var uri =
      query.length > 0 ? this.server + path + "?" + query : this.server + path;
    var self = this;
    var ajax = this.getAjaxObject(
      uri,
      method,
      function (ajax) {
        self.onResponse(ajax);
        if (typeof responseCb !== "undefined" && ajax.readyState == 4) {
          responseCb(self.getResponse(ajax));
        }
      },
      "text/xml; charset=utf-8"
    );
    try {
      var xml = "<?xml version='1.0' encoding='utf-8'?>";
      ajax.send(xml + content);
    } catch (e) {
      alert(e);
    }
  }

  getResponse(ajax) {
    try {
      if (
        navigator.appName == "Microsoft Internet Explorer" &&
        top.location.protocol != "file:"
      ) {
        var xmlDoc = null;
        if (window.DOMParser) {
          var parser = new DOMParser();
          var xmlHttp = new XMLHttpRequest();
          xmlDoc = parser.parseFromString(xmlHttp.responseText, "text/xml");
        } else if (window.ActiveXObject) {
          xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
          xmlDoc.async = false;
          xmlDoc.loadXML(ajax.responseText);
        }
        if (xmlDoc !== null) {
          return XMLHelper.xml2array(xmlDoc);
        } else {
          return null;
        }
      } else if (ajax.readyState == 4 && ajax.status == 200) {
        if (ajax.responseXML !== null) {
          return XMLHelper.xml2array(ajax.responseXML);
        } else {
          return null;
        }
      }
      return null;
    } catch (e) {
      alert(e);
    }
  }

  queryStatus(timeout, next) {
    var path = "/status/query/xml";
    var content = "<TimeOutSec>" + timeout + "</TimeOutSec>";
    // max 10 requests per second
    var self = this;
    window.setTimeout(function () {
      self.postRequest(path, self.session, content, next);
    }, 100);
  }

  queryPreview(timeout) {
    var path = "/preview/query/xml";
    var content = "<TimeOutSec>" + timeout + "</TimeOutSec>";
    // max 10 requests per second
    var self = this;
    window.setTimeout(function () {
      self.postRequest(path, self.session, content);
    }, 100);
  }

  queryEnvironment() {
    var path = "/environment/query/xml";
    this.postRequest(path, "", "");
  }

  registerWorkflow(workflow, next) {
    var path = "/workflow/register/xml";
    this.postRequest(path, "", workflow, next);
    var arr = XMLHelper.xml2array(XMLHelper.getXmlFromString(workflow));
    return arr.Workflow.Name;
  }

  startCollection(name) {
    var path = "/collection/start/xml";
    var xml = "<WorkflowName>" + name + "</WorkflowName>";
    this.postRequest(path, this.session, xml);
  }

  setAnnotations(annotation) {
    var xml = "";
    annotation.forEach(function (item) {
      xml +=
        "<Annotation><Reason>" +
        item.Reason +
        "</Reason><Info>" +
        item.Info +
        "</Info><Modality>" +
        item.Modality +
        "</Modality><Position>" +
        item.Position +
        "</Position></Annotation>";
    });
    var path = "/collection/annotation/xml";
    var env = "<Annotations>" + xml + "</Annotations>";
    this.postRequest(path, this.session, env);
  }

  getAnnotations() {
    var path = "/collection/annotation/xml";
    this.postRequest(path, this.session, "");
  }

  downloadPersonData() {
    if (!(this.session == undefined || this.session == "")) {
      var path = "/collection/person/xml";
      this.postRequest(path, this.session, "");
    }
  }

  resetCollection(next) {
    var path = "/collection/reset/xml";
    this.postRequest(path, this.session, "", next);
  }

  forceCollection() {
    var path = "/collection/force/xml";
    this.postRequest(path, this.session, "");
  }

  stopCollection() {
    var path = "/collection/stop/xml";
    this.postRequest(path, this.session, "");
  }

  sendUserDecision(choice) {
    var path = "/collection/interact/xml";
    var xml = "<UserResponse>" + choice + "</UserResponse>";
    this.postRequest(path, this.session, xml);
  }
}
class RestfulJson extends RestfulClient {
  constructor(server, exceptionCb, statusCb, previewCb, envCb, resultCb) {
    super(server, exceptionCb, statusCb, previewCb, envCb, resultCb);
  }

  postRequest(path, query, content, responseCb) {
    var method = content.length > 0 ? "POST" : "GET";
    var uri =
      query.length > 0 ? this.server + path + "?" + query : this.server + path;
    var self = this;
    var ajax = this.getAjaxObject(
      uri,
      method,
      function (ajax) {
        self.onResponse(ajax);
        if (typeof responseCb !== "undefined" && ajax.readyState == 4) {
          responseCb(self.getResponse(ajax));
        }
      },
      "text/json; charset=utf-8"
    );
    try {
      ajax.send(content);
    } catch (e) {
      alert(e);
    }
  }

  getResponse(ajax) {
    try {
      if (typeof ajax.responseText === "undefined") return null;
      if (ajax.responseText == null) return null;
      if (ajax.responseText == "") return null;
      if (
        navigator.appName == "Microsoft Internet Explorer" &&
        top.location.protocol != "file:"
      ) {
        return JSON.parse(ajax.responseText);
      } else if (ajax.readyState == 4 && ajax.status == 200) {
        return JSON.parse(ajax.responseText);
      }
      return null;
    } catch (e) {
      alert(e);
    }
  }

  queryStatus(timeout, next) {
    var path = "/status/query/json";
    var content = '{"TimeOutSec":' + timeout + "}";
    // max 10 requests per second
    var self = this;
    window.setTimeout(function () {
      self.postRequest(path, self.session, content, next);
    }, 100);
  }

  queryPreview(timeout) {
    var path = "/preview/query/json";
    var content = '{"TimeOutSec":' + timeout + "}";
    // max 10 requests per second
    var self = this;
    window.setTimeout(function () {
      self.postRequest(path, self.session, content);
    }, 100);
  }

  queryEnvironment() {
    var path = "/environment/query/json";
    this.postRequest(path, "", "");
  }

  registerWorkflow(workflow, next) {
    var path = "/workflow/register/json";
    this.postRequest(path, "", workflow, next);
    var wfl = JSON.parse(workflow);
    return wfl.Workflow.Name;
  }

  startCollection(name) {
    var path = "/collection/start/json";
    var json = '{"WorkflowName":"' + name + '"}';
    this.postRequest(path, this.session, json);
  }

  setAnnotations(annotation) {
    var path = "/collection/annotation/json";
    var json = JSON.stringify({ Annotations: { Annotation: annotation } });
    this.postRequest(path, this.session, json);
  }

  getAnnotations() {
    var path = "/collection/annotation/json";
    this.postRequest(path, this.session, "");
  }

  downloadPersonData() {
    if (!(this.session == undefined || this.session == "")) {
      var path = "/collection/person/json";
      this.postRequest(path, this.session, "");
    }
  }

  resetCollection(next) {
    var path = "/collection/reset/json";
    this.postRequest(path, this.session, "", next);
  }

  forceCollection() {
    var path = "/collection/force/json";
    this.postRequest(path, this.session, "");
  }

  stopCollection() {
    var path = "/collection/stop/json";
    this.postRequest(path, this.session, "");
  }

  sendUserDecision(choice) {
    var path = "/collection/interact/json";
    var json = '{"UserResponse":"' + choice + '"}';
    this.postRequest(path, this.session, json);
  }
}
class BioCoreImpl {
  constructor(type, addr) {
    this.active = false;
    this.decisionActive = false;
    this.resultsSent = false;
    this.calibrating = false;
    this.hourglass = new Hourglass();
    this.statusCtrl = new StatusCtrl(this);
    var connection = type || 1;
    switch (connection) {
      case 1:
        this.initRestfulXml(addr);
        break;
      case 2:
        this.initRestfulJson(addr);
        break;
      case 3:
        this.initWSocketXml(addr, 1);
        break;
      case 4:
        this.initWSocketJson(addr, 1);
        break;
    }
    if (typeof this.server === "undefined") {
      alert("Connection type not supported."); // integrators must avoid this
    }
    var self = this;
    this.capture = new CaptureCtrl(
      function () {
        self.server.stopCollection();
        self.capture.hide();
      },
      function () {
        self.server.forceCollection();
      },
      function () {
        self.hourglass.hide();
      },
      function (uri) {
        return self.server.getQualifiedUri(uri);
      }
    );
    this.exceptions = new ExceptionCtrl(function (next) {
      self.server.queryLogs(next);
    });
    this.annotations = new AnnotationsCtrl(
      function (annotation) {
        self.hourglass.show();
        self.server.setAnnotations(annotation);
        self.server.whenSessionOpened(function () {
          self.annotations.hide();
          self.capture.show();
          self.statusCtrl.show(
            1,
            function () {
              self.server.startCollection(self.workflow);
            },
            function () {
              self.capture.hide();
              self.hourglass.hide();
            },
            true
          );
        });
      },
      function () {
        self.annotations.hide();
      },
      function (decision) {
        if (decision === "enumConfirmResult") {
          self.server.setAnnotations(self.annotations.getAnnotations());
        } else if (decision === "enumAbortWorkflow") {
          self.capture.hide();
        }
        self.annotations.hide();
        self.onInteraction(decision);
      }
    );
    this.decisions = new DecisionsCtrl(function (decision) {
      self.onInteraction(decision);
    });
  }

  initRestfulXml(addr) {
    if (
      typeof RestfulXml !== "undefined" &&
      typeof RestfulClient !== "undefined"
    ) {
      this.restful = true;
      var self = this;
      this.server = new RestfulXml(
        addr,
        function (except) {
          self.onException(except);
        },
        function (status, next) {
          self.onStatus(status, next);
        },
        function (preview, next) {
          self.onPreview(preview, next);
        },
        function (env) {
          self.onEnvironment(env);
        },
        function (res) {
          self.onResult(res);
        }
      );
    }
  }

  initRestfulJson(addr) {
    if (
      typeof RestfulJson !== "undefined" &&
      typeof RestfulClient !== "undefined"
    ) {
      this.restful = true;
      var self = this;
      this.server = new RestfulJson(
        addr,
        function (except) {
          self.onException(except);
        },
        function (status, next) {
          self.onStatus(status, next);
        },
        function (preview, next) {
          self.onPreview(preview, next);
        },
        function (env) {
          self.onEnvironment(env);
        },
        function (res) {
          self.onResult(res);
        }
      );
    }
  }

  initWSocketXml(addr, cnt) {
    if (
      typeof WebSocketXml !== "undefined" &&
      typeof BioCoreSocket !== "undefined" &&
      typeof WebSocketClient !== "undefined"
    ) {
      this.restful = false;
      var self = this;
      this.server = new WebSocketXml(
        addr,
        cnt,
        function (except) {
          self.onException(except);
        },
        function (status) {
          self.onStatus(status, function () {});
        },
        function (preview) {
          self.onPreview(preview, function () {});
        },
        function (env) {
          self.onEnvironment(env);
        },
        function (res) {
          self.onResult(res);
        }
      );
    }
  }

  initWSocketJson(addr, cnt) {
    if (
      typeof WebSocketJson !== "undefined" &&
      typeof BioCoreSocket !== "undefined" &&
      typeof WebSocketClient !== "undefined"
    ) {
      this.restful = false;
      var self = this;
      this.server = new WebSocketJson(
        addr,
        cnt,
        function (except) {
          self.onException(except);
        },
        function (status) {
          self.onStatus(status, function () {});
        },
        function (preview) {
          self.onPreview(preview, function () {});
        },
        function (env) {
          self.onEnvironment(env);
        },
        function (res) {
          self.onResult(res);
        }
      );
    }
  }

  startCapture(workflow, onResults) {
    this.hourglass.show();
    this.capture.show();
    this.resultTarget = onResults;
    var self = this;
    this.workflow = this.server.registerWorkflow(workflow, function () {
      self.statusCtrl.show(
        1,
        function () {
          self.active = true;
          self.server.startCollection(self.workflow);
        },
        function () {
          self.capture.hide();
          self.hourglass.hide();
        },
        true
      );
    });
  }

  startCaptureAnnotated(workflow, onResults) {
    this.resultTarget = onResults;
    var self = this;
    this.workflow = this.server.registerWorkflow(workflow, function () {
      self.statusCtrl.show(
        1,
        function () {
          self.active = true;
          self.annotations.show();
        },
        function () {
          self.hourglass.hide();
        },
        true
      );
    });
  }

  reset(next) {
    this.server.session = "";
    this.resultsSent = false;
    this.annotations.resetAnnotation();
    if (this.server.isInitiated()) {
      this.server.resetCollection(next);
    } else {
      this.statusCtrl.show(
        1,
        function () {},
        function () {}
      );
    }
  }

  downloadImageData(fp, cb, format) {
    var uri = this.server.getQualifiedUri(fp.Image.ImageUri);
    if (format === "source") {
      cb(uri);
    } else if (format === "bas64") {
      this.download({
        next: function (res) {
          cb("data:image/bmp;base64," + res);
        },
        format: "base64",
        uuid: fp.Uuid,
        key: uri,
      });
    } else {
      this.download({
        next: cb,
        format: format,
        uuid: fp.Uuid,
        key: uri,
      });
    }
  }

  download(token) {
    var self = this;
    var request = new XMLHttpRequest();
    request.open("GET", token.key);
    request.responseType = "arraybuffer";
    request.onreadystatechange = function () {
      if (request.readyState == 4 && request.status === 200) {
        if (token.format !== "base64") {
          token.next(new Uint8Array(request.response));
        } else {
          token.next(Base64.fromArrayBuffer(new Uint8Array(request.response)));
        }
      }
    };
    request.send();
  }

  checkStatus(timeout, onOk, onCancel) {
    // this.statusCtrl.show(timeout, onOk, onCancel);
  }

  onException(exp) {
    if (exp === "BioCoreWebService Error Collector not ready") {
      this.capture.hide();
      // using last status, because it is more detailed
      if (this.statusCtrl.lastStatusData !== null) {
        this.onStatus(this.statusCtrl.lastStatusData);
      }
    } else {
      var self = this;
      this.exceptions.show(
        "BioCore-Exception-Unexpected",
        function () {
          self.capture.hide();
          self.annotations.hide();
          self.decisions.hide();
          self.hourglass.hide();
          self.exceptions.hide();
          self.active = false;
        },
        exp
      );
    }
  }

  onStatus(status, next) {
    try {
      this.statusCtrl.onStatus(status);
      if (status.UserRequest !== undefined) {
        if (!this.decisionActive) {
          this.decisionActive = true;
          if (
            status.UserRequest.RequestCode === "enumTooManyBiometrics" ||
            status.UserRequest.RequestCode === "enumMissingBiometrics"
          ) {
            var self = this;
            this.annotations.setRequest(status.UserRequest);
            this.annotations.showSecondary();
          } else {
            this.decisions.setRequest(status.UserRequest);
            this.decisions.show();
          }
        }
      } else {
        if (this.decisionActive) {
          this.decisionActive = false;
          this.annotations.hide();
          this.decisions.hide();
        }
      }
      if (status.WorkflowCompleted === true) {
        if (this.active && !this.resultsSent) {
          this.resultsSent = true;
          this.server.downloadPersonData();
          this.capture.hide();
          this.active = false;
        }
      }
      if (this.calibrating === true && status.IsCalibrating !== true) {
        this.hourglass.hide();
        this.exceptions.hide();
      }
      if (
        status.FingerprintDevice.Name === "" &&
        status.FaceDevice.Name === "" &&
        status.IrisDevice.Name === ""
      ) {
        this.onDeviceLost();
      } else {
        if (status.FingerprintDevice.Name !== "") {
          if (status.FingerprintDevice.IsReady === false) {
            if (status.IsCalibrating === true) {
              this.onDirtyGlass();
            }
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
    next();
  }

  onPreview(prev, next) {
    try {
      this.capture.onPreview(prev, next);
    } catch (e) {
      console.log(e);
      next();
    }
  }

  onEnvironment(env) {}

  onResult(res) {
    if (
      typeof this.resultTarget !== "undefined" &&
      this.resultTarget !== null
    ) {
      this.resultTarget(res);
    }
  }

  onInteraction(decision) {
    this.decisionActive = false;
    this.decisions.hide();
    this.server.sendUserDecision(decision);
  }

  onDirtyGlass() {
    if (this.active === true) {
      this.calibrating = true;
      var self = this;
      this.exceptions.show("BioCore-Exception-DirtyGlass");
    }
  }

  onDeviceLost() {
    if (this.active === true) {
      var self = this;
      this.exceptions.show("BioCore-Exception-NoDevice", function () {
        self.capture.hide();
        self.annotations.hide();
        self.decisions.hide();
        self.exceptions.hide();
        self.active = false;
      });
    }
  }
}
var BioCore = (function () {
  var data = `
	<div id="BioCore-Capture-Outer" class="BioCore-modal">
  <div id="BioCore-Box-Capture">
    <header>
      <div id="BioCore-Capture-Title" />
    </header>
    <div id="BioCore-Capture">
      <div class="panelcontainer">
        <div class="capturepanel">
          <div id="BioCore-ActivePosition" class="">&emsp;-&emsp;</div>
          <div id="BioCore-QualityIndicators">
            <div id="BioCore-QualityIndicator0" class=""></div>
            <div id="BioCore-QualityIndicator1" class=""></div>
            <div id="BioCore-QualityIndicator2" class=""></div>
            <div id="BioCore-QualityIndicator3" class=""></div><br />
            <div id="BioCore-QualityIndicator4" class=""></div>
          </div>
          <div id="BioCore-Preview-Canvas" class="cpCanvas"></div>
        </div>
        <div class="BioCore-BtnPanel">
          <div id="BioCore-Btn-StopCollection" class="BioCore-Btn"></div>
          <div id="BioCore-Btn-ForceCollection" class="BioCore-Btn"></div>
        </div>
      </div>
    </div>
  </div>
</div>
<div id="BioCore-Overlay-L1">
  <div id="BioCore-Annotation-Outer" class="BioCore-modal">
    <div id="BioCore-Box-Annotation">
      <header>
        <div id="BioCore-Annotation-Title" />
      </header>
      <div id="BioCore-Annotation">
        <div class="panelcontainer">
          <div class="annotationpanel">
            <div id="Annotation_Hands">
              <div id="Annotation_LeftHand">
                <div id="Annotation_LeftFour">
                  <div id="Annotation_LeftLittle" class="Annotation-Item BioCore-Annotation0" data-id="LeftLittle" data-pos="10"></div>
                  <div id="Annotation_LeftRing" class="Annotation-Item BioCore-Annotation0" data-id="LeftRing" data-pos="9"></div>
                  <div id="Annotation_LeftMiddle" class="Annotation-Item BioCore-Annotation0" data-id="LeftMiddle" data-pos="8"></div>
                  <div id="Annotation_LeftIndex" class="Annotation-Item BioCore-Annotation0" data-id="LeftIndex" data-pos="7"></div>
                </div>
                <div id="Annotation_LeftPalm">
                  <div id="Annotation_LeftUpperPalm" class="Annotation-Item deactivated" data-id="LeftUpperPalm"></div>
                  <div id="Annotation_LeftLowerPalm" class="Annotation-Item deactivated" data-id="LeftLowerPalm"></div>
                </div>
                <div id="Annotation_LeftThumb" class="Annotation-Item BioCore-Annotation0" data-id="LeftThumb" data-pos="6"></div>
              </div>
              <div id="Annotation_RightHand">
                <div id="Annotation_RightThumb" class="Annotation-Item BioCore-Annotation0" data-id="RightThumb" data-pos="1"></div>
                <div id="Annotation_RightFour">
                  <div id="Annotation_RightIndex" class="Annotation-Item BioCore-Annotation0" data-id="RightIndex" data-pos="2"></div>
                  <div id="Annotation_RightMiddle" class="Annotation-Item BioCore-Annotation0" data-id="RightMiddle" data-pos="3"></div>
                  <div id="Annotation_RightRing" class="Annotation-Item BioCore-Annotation0" data-id="RightRing" data-pos="4"></div>
                  <div id="Annotation_RightLittle" class="Annotation-Item BioCore-Annotation0" data-id="RightLittle" data-pos="5"></div>
                </div>
                <div id="Annotation_RightPalm">
                  <div id="Annotation_RightUpperPalm" class="Annotation-Item deactivated" data-id="RightUpperPalm"></div>
                  <div id="Annotation_RightLowerPalm" class="Annotation-Item deactivated" data-id="RightLowerPalm"></div>
                </div>
              </div>
            </div>
            <div id="Annotation-Label" class=""><br></div>
            <nav id="BioCore-Annotation-ContextMenu" class="menu">
              <ul class="menu-items">

                <li class="menu-item">
                  <a href="#" class="menu-item-link BioCore-Annotation4" data-action="4" data-annotation="PermanentMissing"></a>
                </li>
              </ul>
            </nav>
          </div>
          <div id="BioCore-Annotation-Buttons" class="BioCore-BtnPanel">
            <div id="BioCore-Btn-StartCollection" class="BioCore-Btn"></div>
            <div id="BioCore-Btn-Reset" class="BioCore-Btn"></div>
            <div id="BioCore-Btn-Cancel" class="BioCore-Btn"></div>
          </div>
          <div id="BioCore-Annotation-SupportedDecisions" class="BioCore-BtnPanel">
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<div id="BioCore-Overlay-L2">
  <div id="BioCore-Decisions-Outer" class="BioCore-modal">
    <div id="BioCore-Box-Interaction">
      <header>
        <div id="BioCore-Interaction-Title"></div>
      </header>
      <table id="BioCore-Interaction-Table" class="BioCore-Box-Table">
        <tr><td><div id="BioCore-Title-Step"></div></td><td><div id="BioCore-Content-Step"></div></td></tr>
        <tr><td><div id="BioCore-Title-Code"></div></td><td><div id="BioCore-Content-Code"></div></td></tr>
        <tr>
          <td colspan="2"><div id="BioCore-Box-SupportedDecisions"></div></td>
        </tr>
      </table>
    </div>
  </div>
</div>
<div id="BioCore-Overlay-L3">
  <div id="BioCore-Box-Hourglass">
    <div class="BioCore-Loading BioCore-Loading-Bar">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>
</div>
<div id="BioCore-Overlay-L4">
  <div id="BioCore-Status-Outer" class="BioCore-modal">
    <div id="BioCore-Box-Status">
      <header>
        <div id="BioCore-Status-Title"></div>
      </header>
      <table id="BioCore-Status-Table">
        <tr id="BioCore-Status-Connection" class="BioCore-Status-unchecked"><td><div class="BioCore-Status-Label"></div></td><td><div class="BioCore-Status-Result"></div></td></tr>
        <tr id="BioCore-Status-License" class="BioCore-Status-unchecked"><td><div class="BioCore-Status-Label"></div></td><td><div class="BioCore-Status-Result"></div></td></tr>
        <tr id="BioCore-Status-Device" class="BioCore-Status-unchecked"><td><div class="BioCore-Status-Label"></div></td><td><div class="BioCore-Status-Result"></div></td></tr>
        <tr id="BioCore-Status-Fingerprint" class="BioCore-Status-unchecked"><td><div class="BioCore-Status-Label"></div></td><td><div class="BioCore-Status-Result"></div></td></tr>
        <tr id="BioCore-Status-Face" class="BioCore-Status-unchecked"><td><div class="BioCore-Status-Label"></div></td><td><div class="BioCore-Status-Result"></div></td></tr>
        <tr id="BioCore-Status-Iris" class="BioCore-Status-unchecked"><td><div class="BioCore-Status-Label"></div></td><td><div class="BioCore-Status-Result"></div></td></tr>
        <tr id="BioCore-Status-Calibrating" class="BioCore-Status-unchecked"><td><div class="BioCore-Status-Label"></div></td><td><div class="BioCore-Status-Result"></div></td></tr>
        <tr id="BioCore-Status-Session" class="BioCore-Status-unchecked"><td><div class="BioCore-Status-Label"></div></td><td><div class="BioCore-Status-Result"></div></td></tr>
        <tr id="BioCore-Status-Ready" class="BioCore-Status-unchecked"><td><div class="BioCore-Status-Label"></div></td><td><div class="BioCore-Status-Result"></div></td></tr>
      </table>
      <div class="BioCore-BtnPanel">
        <div id="BioCore-Btn-StatusCancel" class="BioCore-Btn"></div>
      </div>
    </div>
  </div>
</div>
<div id="BioCore-Overlay-L5">
  <div id="BioCore-Errors-Outer" class="BioCore-modal">
    <div id="BioCore-Box-Exception">
      <header>
        <div id="BioCore-Exception-Title"></div>
      </header>
      <div id="BioCore-Exception-Message"></div>
      <div id="BioCore-Exception-Details" class="hidden">
        <table id="BioCore-Exception-Table">
          <tr id="BioCore-Exception-Message-Line"><td><div id="BioCore-Exception-Message-Title"></div></td><td><div id="BioCore-Exception-Message-Content"></div></td></tr>
          <tr id="BioCore-Exception-Code-Line"><td><div id="BioCore-Exception-Code-Title"></div></td><td><div id="BioCore-Exception-Code-Content"></div></td></tr>
          <tr id="BioCore-Exception-CallStack-Line" class="hidden"><td><div id="BioCore-Exception-CallStack-Title"></div></td><td><div id="BioCore-Exception-CallStack-Content"></div></td></tr>
          <tr id="BioCore-Exception-LogData-Line"><td><div id="BioCore-Exception-LogData-Title"></div></td><td><div id="BioCore-Exception-LogData-Content"></div></td></tr>
        </table>
        <!--<button type="button" id="BioCore-Exception-Logs-Title" class="BioCore-Panel-Collapsible"></button>
        <div id="BioCore-Exception-Logs-Content" class="BioCore-Panel-Content"></div>-->
      </div>
      <div class="BioCore-BtnPanel">
        <div id="BioCore-Btn-Accept" class="BioCore-Btn"></div>
      </div>
    </div>
  </div>
</div>

  `;

  // <li class="menu-item">
  // <a href="#" class="menu-item-link BioCore-Annotation0" data-action="0" data-annotation="NotAnnotated"></a>
  //               </li>
  //               <li class="menu-item">
  //                 <a href="#" class="menu-item-link BioCore-Annotation1" data-action="1" data-annotation="OtherReason"></a>
  //               </li>
  //               <li class="menu-item">
  //                 <a href="#" class="menu-item-link BioCore-Annotation2" data-action="2" data-annotation="Handicaped"></a>
  //               </li>
  //               <li class="menu-item">
  //                 <a href="#" class="menu-item-link BioCore-Annotation3" data-action="3" data-annotation="UnableToAcquire"></a>
  //               </li>

  var impl = null;

  var appendHtml = function (region, design) {
    var style = document.createElement("link");
    style.setAttribute("rel", "stylesheet");
    style.setAttribute("href", "/BioCore_" + design + ".css");
    document.getElementsByTagName("head")[0].appendChild(style);
    var style = document.createElement("link");
    style.setAttribute("rel", "stylesheet");
    style.setAttribute("href", "/BioCore_" + region + ".css");
    document.getElementsByTagName("head")[0].appendChild(style);
    var div = document.createElement("div");
    div.setAttribute("id", "BioCore-Overlay-L0");
    div.innerHTML = data;
    document.body.appendChild(div);
  };

  return {
    RESTFUL_XML: 1,
    RESTFUL_JSON: 2,
    WSOCKET_XML: 3,
    WSOCKET_JSON: 4,

    init: function (type, addr, region = "en", design = "default") {
      appendHtml(region, design);
      impl = new BioCoreImpl(type, addr);
    },

    startCapture: function (workflow, onResults) {
      impl.startCapture(workflow, onResults);
    },

    startCaptureAnnotated: function (workflow, onResults) {
      impl.startCaptureAnnotated(workflow, onResults);
    },

    getImage: function (fp, onImage, format) {
      format = format || "source";
      impl.downloadImageData(fp, onImage, format);
    },

    reset: function (next) {
      impl.reset(next);
    },

    status: function (timeout, onOk, onCancel) {
      impl.checkStatus(timeout, onOk, onCancel);
    },
  };
})();
