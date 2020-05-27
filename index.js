const fs = require("fs");
const _ = require("lodash");
const { JSDOM } = require("jsdom");

const targetElementId = "make-everything-ok-button";

try {

    let args = process.argv.slice(2);
    const originFileName = args.shift();
    const originFile = fs.readFileSync(`./samples/${originFileName}`);
    const originDom = new JSDOM(originFile);

    const originButton = originDom.window.document.getElementById(targetElementId)
    const originAttrubutes = Array.prototype.slice.apply(originButton.attributes);

    const data = {
        text: getText(originButton.textContent),
        attributes: getAttrubutes(originAttrubutes)
    };

    const casesData = getCasesData(data, args);
    showResult(data, casesData);

} catch (err) {
    console.error('Error trying to find element by id', err);
}

function getText(text) {
    return cleanString(text);
}

function getAttrubutes(attributes) {
    const data = {};
    attributes.forEach(attribute => {
        data[attribute.name] = cleanString(attribute.value);
    });
    return data;
}

function cleanString(string) {
    return string.replace(/[|&;$%@"#<>()+,]/g, "").trim().toLowerCase();
}

function getScore(originData, text, attributes) {
    let score = 0;
    if (originData.text.includes(text)) {
        score += 50;
    }
    Object.keys(attributes).forEach(attribute => {
        const attributeValue = attributes[attribute];
        if (attribute ===  "href"  && originData.attributes.href.includes(attributeValue)) {
            score += 20;
        }
        if (attribute ===  "title"  && originData.attributes.title.includes(attributeValue)) {
            score += 20;
        }
    });
    return score;
}

function getCasesData(originData, args) {
    const casesData = {};
    for (let fileName of args) {
        // console.log("File - ", fileName);
        const sampleFile = fs.readFileSync(`./samples/${fileName}`);
        const dom = new JSDOM(sampleFile);
        const buttonsData =[];
        const buttons = dom.window.document.getElementsByClassName("btn"); // need to improve
        for (let button of buttons) {
            const attrubutes = Array.prototype.slice.apply(button.attributes);
            const buttonText = getText(button.textContent);
            const buttonAttributes = getAttrubutes(attrubutes);
            const baseScore = 10;
            buttonsData.push({
                domElementLink: button,
                text: buttonText,
                originText: button.textContent.trim(),
                attributes: buttonAttributes,
                score: baseScore + getScore(originData, buttonText, buttonAttributes)
            });
        }
        casesData[fileName] = _.orderBy(buttonsData, "score", "desc");
    }
    return casesData;
}

function showResult(origin, casesData) {
    console.log(`Found origin button: id - ${targetElementId}, with text - "${origin.text}"`);
    Object.keys(casesData).forEach(fileName => {
        const fileButtons = casesData[fileName];
        const buttonsWithMaxScore = fileButtons[0]; // need to improve
        console.log(`Found button in file ${fileName}: with text - "${buttonsWithMaxScore.originText}", path - ${buttonsWithMaxScore.domElementLink}`);
    });
}
