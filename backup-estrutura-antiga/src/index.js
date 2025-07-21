"use strict";
exports.__esModule = true;
var react_1 = require("react");
var client_1 = require("react-dom/client");
require("./index.css");
var App_1 = require("./App");
var root = client_1["default"].createRoot(document.getElementById('root'));
root.render(<react_1["default"].StrictMode>
    <App_1["default"] />
  </react_1["default"].StrictMode>);
