import puppeteer, { Puppeteer } from "puppeteer"
import { writeToPath } from "fast-csv"

const URL = 'https://maps.kelowna.ca/Public/MapViewer/?run=findparcel'
const LAUNCH_CONFIG = {
    headless: false,
    defaultViewport: false,
    //userDataDir: "./tmp"
}
const AGREE_BUTTON_SELECTOR = 'div > div.workflow-container-region-holder.bound-visible > div > div > form > div.form-btns > button'
const SEARCH_INPUT_SELECTOR = '#gcx_search'
const SEARCH_BUTTON_SELECTOR = 'body > div > div > div.shell-container > div > div.large-shell-header > div.region.header-region.region-active > div > div > div.banner-content-region > div.view.SearchView.active > div > div.search-box > button'
const PROPERTIES_UL_SELECTOR = 'body > div > div > div.shell-container > div > div.large-shell-main > div.large-shell-left.bound-visible.panel-open > div.region.data-region.region-active > div > div > div.panel-scroll-container.region-active > div.view.DataFrameResultsContainerView.active > div > div.panel-scroll-container.region-active > div.view.FeatureSetResultsView.active > div.layer-addition.map-services-dialog > div.results-list > ul'
const PROPERTIES_HANDLE_SELECTOR = 'body > div > div > div.shell-container > div > div.large-shell-main > div.large-shell-left.bound-visible.panel-open > div.region.data-region.region-active > div > div > div.panel-scroll-container.region-active > div.view.DataFrameResultsContainerView.active > div > div.panel-scroll-container.region-active > div.view.FeatureSetResultsView.active > div.layer-addition.map-services-dialog > div.results-list > ul > li'
const DETAIL_1_UL_SELECTOR = 'body > div > div > div.shell-container > div > div.large-shell-main > div.large-shell-left.bound-visible.panel-open > div.region.data-region.region-active > div > div > div.panel-scroll-container.region-active > div.view.DataFrameResultsContainerView.active > div > div.panel-scroll-container.region-active > div.view.FeatureDetailsCompactView.active > div.multi-region-view > div > div.region > div.view.FeatureAttributesProviderView.active > div > div > div:nth-child(1) > ul'
const DETAIL_1_HANDLE_SELECTOR = 'body > div > div > div.shell-container > div > div.large-shell-main > div.large-shell-left.bound-visible.panel-open > div.region.data-region.region-active > div > div > div.panel-scroll-container.region-active > div.view.DataFrameResultsContainerView.active > div > div.panel-scroll-container.region-active > div.view.FeatureDetailsCompactView.active > div.multi-region-view > div > div.region > div.view.FeatureAttributesProviderView.active > div > div > div:nth-child(1) > ul > li'
const DETAIL_2_UL_SELECTOR = 'body > div > div > div.shell-container > div > div.large-shell-main > div.large-shell-left.bound-visible.panel-open > div.region.data-region.region-active > div > div > div.panel-scroll-container.region-active > div.view.DataFrameResultsContainerView.active > div > div.panel-scroll-container.region-active > div.view.FeatureDetailsCompactView.active > div.multi-region-view > div > div.region > div.view.FeatureAttributesProviderView.active > div > div > div:nth-child(2) > ul'
const DETAIL_2_HANDLE_SELECTOR = 'body > div > div > div.shell-container > div > div.large-shell-main > div.large-shell-left.bound-visible.panel-open > div.region.data-region.region-active > div > div > div.panel-scroll-container.region-active > div.view.DataFrameResultsContainerView.active > div > div.panel-scroll-container.region-active > div.view.FeatureDetailsCompactView.active > div.multi-region-view > div > div.region > div.view.FeatureAttributesProviderView.active > div > div > div:nth-child(2) > ul > li'
main()

async function main() {
    var details = {
        StreetNumber: "",
        StreetName: "",
        PlanNumber: "",
        LotSize: "",
        LotNumber: "",
        PropertyType: "",
        AssessmentClass: "",
        LandValue: "",
        LandValuePerAcre: "",
        ImprovementValue: "",
        GrossValue: "",
        GrossValuePerAcre: "",
        PropertyTaxLevy: "",
        PropertyTaxLevyAcre: ""
    }

    const address = process.argv[2]
    const browser = await puppeteer.launch(LAUNCH_CONFIG);
    const page = await browser.newPage();
    await page.goto(URL);
    // close pop up
    const agreebutton = await page.waitForSelector(AGREE_BUTTON_SELECTOR)
    await agreebutton.click()

    // search for address
    const input = await page.waitForSelector(SEARCH_INPUT_SELECTOR)
    await input.type(address, { delay: 20 })
    const searchButton = await page.waitForSelector(SEARCH_BUTTON_SELECTOR)
    await searchButton.click()

    // get property
    const featuredDescriptions = []
    await evalListItems(page, PROPERTIES_UL_SELECTOR, PROPERTIES_HANDLE_SELECTOR, async (propertyHandle) => {
        const featuredDescription = await page.evaluate(el => el.querySelector('div.gcx-list-desc > div').textContent, propertyHandle)
        featuredDescriptions.push({ desc: featuredDescription, handle: propertyHandle })
    })
    const property = chooseProperty(featuredDescriptions, address)
    await page.evaluate(el => el.querySelector('div.list-menu-title > button').click(), property.handle)

    // get details
    const propertyDetails = []
    await evalListItems(page, DETAIL_1_UL_SELECTOR, DETAIL_1_HANDLE_SELECTOR, async (detailHandle) => {
        const propertyDetailLabel = await page.evaluate(el => el.querySelector('span').textContent, detailHandle)
        const propertyDetailValue = await page.evaluate(el => el.querySelector('div > span.bound-visible-inline').textContent, detailHandle)
        propertyDetails.push([propertyDetailLabel, propertyDetailValue])
    })
    await evalListItems(page, DETAIL_2_UL_SELECTOR, DETAIL_2_HANDLE_SELECTOR, async (detailHandle) => {
        const propertyDetailLabel = await page.evaluate(el => el.querySelector('span').textContent, detailHandle)
        const propertyDetailValue = await page.evaluate(el => el.querySelector('div > span.bound-visible-inline').textContent, detailHandle)
        propertyDetails.push([propertyDetailLabel, propertyDetailValue])
    })

    // fill in details obj with details
    for (let i = 0; i < propertyDetails.length; i++) {
        switch (propertyDetails[i][0]) {
            case 'Plan Number':
                details.PlanNumber = propertyDetails[i][1]
            case 'Lot Number':
                details.LotNumber = propertyDetails[i][1]
            case 'Street Number':
                details.StreetNumber = propertyDetails[i][1]
            case 'Street Name':
                details.StreetName = propertyDetails[i][1]
            case 'LOT_SIZE':
                details.LotSize = propertyDetails[i][1]
            case 'Property Type':
                details.PropertyType = propertyDetails[i][1]
        }
    }
    console.log(details)

    //await browser.close();
}
async function evalListItems(page, UL_SELECTOR, HANDLE_SELECTOR, cb) {
    await page.waitForSelector(UL_SELECTOR)
    const handles = await page.$$(HANDLE_SELECTOR)
    for (const handle of handles) {
        await cb(handle)
    }
}

function chooseProperty(featuredDescriptions, address) {
    const descriptionsWithValidPlanNumber = []
    for (const featuredDescription of featuredDescriptions) {
        const arr = featuredDescription.desc.match(/^Plan: \w+/)
        if (arr) {
            descriptionsWithValidPlanNumber.push(featuredDescription)
            break
        }
    }
    if (descriptionsWithValidPlanNumber.length == 1) {
        return descriptionsWithValidPlanNumber[0]
    }

    // TODO: case where you have multiple valid plan numbers
    // TODO: case where there are no plan numbers
}
