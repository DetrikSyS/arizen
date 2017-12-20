// @flow
/*jshint esversion: 6 */
/*jslint node: true */
"use strict";

const {DateTime} = require("luxon");

function logout() {
    ipcRenderer.send("do-logout");
    location.href = "./login.html";
}

function exitApp() {
    ipcRenderer.send("exit-from-menu");
}

function openUrl(url) {
    const {shell} = require("electron");
    shell.openExternal(url);
}

function fixLinks() {
    document.querySelectorAll("a[href^='http']").forEach(link =>
        link.addEventListener("click", event => {
            event.preventDefault();
            openUrl(link.href);
        }));
}

function formatBalance(balance) {
    return balance.toFixed(8);
}

function formatEpochTime(epochSeconds) {
    return DateTime.fromMillis(epochSeconds).toLocaleString(DateTime.DATETIME_MED);
}

function hideElement(node, yes) {
    if (yes) {
        node.classList.add("hidden");
    } else {
        node.classList.remove("hidden");
    }
}

function clearChildNodes(parent) {
    parent.childNodes.forEach(p => parent.removeChild(p));
}

function cloneTemplate(id) {
    return document.getElementById(id).content.cloneNode(true).firstElementChild;
}

function showDialogFromTemplate(templateName, dialogInit, onClose = null) {
    const dialog = cloneTemplate(templateName);
    if (dialog.tagName !== "ARIZEN-DIALOG")
        throw new Error("No dialog in the template");
    document.body.appendChild(dialog);
    dialogInit(dialog);
    dialog.addEventListener("close", () => {
        if (onClose)
            onClose();
        dialog.remove()
    });
    dialog.showModal();
}

function scrollIntoViewIfNeeded(parent, child) {
    const parentRect = parent.getBoundingClientRect();
    const childRect = child.getBoundingClientRect();
    if (childRect.top < parentRect.top ||
        childRect.right > parentRect.right ||
        childRect.bottom > parentRect.bottom ||
        childRect.left < parentRect.left)
        child.scrollIntoView();
}

function createLink(url, text) {
    const link = document.createElement("a");
    link.href = url;
    link.textContent = text;
    return link;
}

// TODO this doesn't belong here
function showAboutDialog() {
    const pkg = require("../package.json");
    showDialogFromTemplate("aboutDialogTemplate", dialog => {
        dialog.querySelector(".aboutHomepage").appendChild(createLink(pkg.homepage, pkg.homepage));
        dialog.querySelector(".aboutVersion").textContent = pkg.version;
        dialog.querySelector(".aboutLicense").textContent = pkg.license;
        const authorsNode = dialog.querySelector(".aboutAuthors");
        pkg.contributors.forEach(function (person) {
            const row = document.createElement("div");
            row.textContent = person.name;
            if (/@/.test(person.email)) {
                row.textContent += " ";
                row.appendChild(createLink("mailto: " + person.email, person.email));
            }
            authorsNode.appendChild(row);
        });
    });
}

// TODO this doesn't belong here
let settings;
(() => {
    const {ipcRenderer} = require("electron");
    ipcRenderer.on("settings", (sender, settingsStr) => settings = JSON.parse(settingsStr));
})();

function showSettingsDialog() {
    showDialogFromTemplate("settingsDialogTemplate", dialog => {
        const inputTxHistory = dialog.querySelector(".settingsTxHistory");
        const inputExplorerUrl = dialog.querySelector(".settingsExplorerUrl");
        const inputApiUrls = dialog.querySelector(".settingsApiUrls");
        const saveButton = dialog.querySelector(".settingsSave");

        inputTxHistory.value = settings.txHistory;
        inputExplorerUrl.value = settings.explorerUrl;
        inputApiUrls.value = settings.apiUrls.join("\n");

        dialog.querySelector(".settingsSave").addEventListener("click", () => {

            const newSettings = {
                txHistory: parseInt(inputTxHistory.value),
                explorerUrl: inputExplorerUrl.value.trim().replace(/\/?$/, ""),
                apiUrls: inputApiUrls.value.split(/\s+/).filter(s => !/^\s*$/.test(s)).map(s => s.replace(/\/?$/, "")),
            };
            ipcRenderer.send("save-settings", JSON.stringify(newSettings));
            dialog.close();
        });
    });
}

function openZenExplorer(path) {
    openUrl(settings.explorerUrl + "/" + path);
}

function setLangToArrayNodes(elArray, value) {
    for (let i = 0; i < elArray.length; i++) {
        if (elArray[i].hasOwnProperty("innerHTML")) {
            elArray[i].innerHTML = value;
        } else {
            elArray[i].textContent = value;
        }
    }
}

function loadLang() {
    const {ipcRenderer} = require("electron");
    ipcRenderer.on("settings", (...args) => {
        let langStr = JSON.parse(args[1]).lang;
        if (!langStr)
            return;
        let lang = require("./lang/lang_"+ langStr + ".json");

        setLangToArrayNodes(document.querySelectorAll("[data-tr='showSettingsDialogButton']"), lang.wallet.showSettingsDialogButton);
        setLangToArrayNodes(document.querySelectorAll("[data-tr='showAboutDialogButton']"), lang.wallet.showAboutDialogButton);
        setLangToArrayNodes(document.querySelectorAll("[data-tr='refreshWallet']"), lang.wallet.refreshWallet);
        setLangToArrayNodes(document.querySelectorAll("[data-tr='logout']"), lang.wallet.logout);
        setLangToArrayNodes(document.querySelectorAll("[data-tr='exit']"), lang.wallet.exit);

        // tab Overview
        setLangToArrayNodes(document.querySelectorAll("[data-tr='tabOverview']"), lang.wallet.tabOverview.label);
        setLangToArrayNodes(document.querySelectorAll("[data-tr='tabOverviewList']"), lang.wallet.tabOverview.listOfAddresses);
        setLangToArrayNodes(document.querySelectorAll("[data-tr='tabOverviewShowZeroBalances']"), lang.wallet.tabOverview.showZeroBalances);
        setLangToArrayNodes(document.querySelectorAll("[data-tr='tabOverviewNewAddress']"), lang.wallet.tabOverview.newAddress);

        // tab Deposit
        setLangToArrayNodes(document.querySelectorAll("[data-tr='tabDeposit']"), lang.wallet.tabDeposit.label);

        // tab Withdraw
        setLangToArrayNodes(document.querySelectorAll("[data-tr='tabWithdraw']"), lang.wallet.tabWithdraw.label);
    });
}

loadLang();
