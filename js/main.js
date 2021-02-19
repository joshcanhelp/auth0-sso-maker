const sidebar = document.getElementById("sidebar");
const sticky = sidebar.offsetTop;
const allFields = document.getElementsByClassName("js-saml");
const jsonOutput = document.getElementById("json-output");
const ymlOutput = document.getElementById("yml-output");

window.onload = () => {
  buildJsonFromFields();
  stickIt();
};

window.onscroll = () => {
  stickIt();
};

document.getElementById("js-copy-json").addEventListener("click", () => {
  const copyText = document.getElementById("json-output");
  copyText.select();
  document.execCommand("copy");
  window.getSelection().removeAllRanges();
});

document.getElementById("js-copy-yml").addEventListener("click", () => {
  const copyText = document.getElementById("yml-output");
  copyText.select();
  document.execCommand("copy");
  window.getSelection().removeAllRanges();
});

Array.from(allFields).forEach((node) => {
  switch (node.type) {
    case "checkbox":
    case "radio":
      node.addEventListener("change", () => {
        buildJsonFromFields();
      });
      break;

    case "number":
      node.addEventListener("change", () => {
        buildJsonFromFields();
      });
    // Expected fall-through

    default:
      node.addEventListener("keyup", () => {
        buildJsonFromFields();
      });
  }
});

const stickIt = () => {
  if (window.pageYOffset >= sticky) {
    sidebar.classList.add("sticky");
  } else {
    sidebar.classList.remove("sticky");
  }
};

const buildJsonFromFields = () => {
  const outputObject = {};
  const recipeObject = {
    callbacks: [],
    addons: {
      samlp: {},
    },
  };

  Array.from(allFields).forEach((node) => {
    // Specific handling
    if ("callbacks" === node.name) {
      if (node.value) {
        node.classList.remove("error");
        recipeObject.callbacks = node.value.split("\n");
      } else {
        node.classList.add("error");
      }
      return;
    }

    switch (node.type) {
      case "text":
      case "url":
        if (node.value) {
          outputObject[node.name] = node.value;
        }
        break;

      case "number":
        outputObject[node.name] = parseInt(node.value, 10);
        break;

      case "checkbox":
        outputObject[node.name] = node.checked;
        break;

      case "radio":
        if (node.checked) {
          outputObject[node.name] = node.value;
        }
        break;
    }

    // Textareas
    if ("mappings" === node.name) {
      outputObject["mappings"] = {};
      node.value.split("\n").forEach((mapping) => {
        const mappingArr = mapping.split(":").map((item) => item.trim());
        outputObject["mappings"][mappingArr[0]] = mappingArr[1];
      });
    }

    if ("nameIdentifierProbes" === node.name) {
      outputObject["nameIdentifierProbes"] = node.value.split("\n");
    }

    if ("signingCert" === node.name && node.value) {
      outputObject["signingCert"] = node.value;
    }
  });

  Object.keys(outputObject).forEach((key) => {
    if (key.includes(".")) {
      const nameParts = key.split(".");

      if (typeof outputObject[nameParts[0]] === "undefined") {
        outputObject[nameParts[0]] = {};
      }

      outputObject[nameParts[0]][nameParts[1]] = outputObject[key];
      delete outputObject[key];
    }
  });

  jsonOutput.value = JSON.stringify(outputObject, null, 2);

  recipeObject.addons.samlp = outputObject;
  ymlOutput.value = jsyaml.dump(recipeObject, {
    quotingType: `"`,
    forceQuotes: true,
  });
};
