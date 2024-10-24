import puppeteer, { Puppeteer } from "puppeteer"
import * as fs from 'fs';
import * as csv from 'fast-csv';

const URL_WEB = 'https://maps.kelowna.ca/Public/MapViewer/'
const LAUNCH_CONFIG = {
    headless: false,
    defaultViewport: false,
    //userDataDir: "./tmp",
    slowMo: 50
}
main()

async function main() {
    const streetName = []
    fs.createReadStream('./Legal_Parcel.csv', 'utf8')
        .pipe(csv.parse({ headers: true }))
        .on('error', error => console.error(error))
        .on('data', row => {
            const index = streetName.indexOf(row.str_name)
            if (index === -1) {
                streetName.push(row.str_name)
            }
        })
        .on('end', (rowCount) => console.log(`Parsed ${rowCount} rows`));


    const AgreeButtonSelector = 'div > div.workflow-container-region-holder.bound-visible > div > div > form > div.form-btns > button'
    const SearchInputSelector = '#gcx_search'
    const SearchButtonSelector = 'body > div > div > div.shell-container > div > div.large-shell-header > div.region.header-region.region-active > div > div > div.banner-content-region > div.view.SearchView.active > div > div.search-box > button'
    const HamburgerSelector = 'body > div > div > div.shell-container > div > div.large-shell-main > div.large-shell-left.bound-visible.panel-open > div.region.data-region.region-active > div > div > div.panel-scroll-container.region-active > div.view.DataFrameResultsContainerView.active > div > div.panel-header.banner-noselect.bound-visible > div.panel-header-contents.bound-visible > button.panel-header-button.menu-button.bound-visible'
    const DownloadSelector = 'body > div > div > div.shell-container > div > div.large-shell-main > div.large-shell-left.bound-visible.panel-open > div.region.data-region.region-active > div > div > div.panel-scroll-container.region-active > div.view.DataFrameResultsContainerView.active > div > div.panel-header.banner-noselect.bound-visible > div.smart-panel-hoisted-menu-inline.bound-visible > div > ul > li:nth-child(5) > button'
    const ModalSelector = '#modal-description'

    const browser = await puppeteer.launch(LAUNCH_CONFIG);
    const page = await browser.newPage();
    await page.goto(URL_WEB)

    const agreeButtonHandle = await page.waitForSelector(AgreeButtonSelector)
    await agreeButtonHandle.click()

    for (const name of streetName) {
        await page.waitForNetworkIdle()
        await page.$eval('#gcx_search', el => el.value = "");
        try {
            await page.type(SearchInputSelector, name, { delay: 40 })
            await page.click(SearchButtonSelector)
            await page.waitForNetworkIdle()
            await page.click(HamburgerSelector)
            await page.waitForNetworkIdle()
            await page.click(DownloadSelector)
            await page.waitForNetworkIdle()
            const modalHandle = await page.$(ModalSelector)
            await page.evaluate(el => {
                const element = el.querySelector('.active > div > div > button')
                element.click()
            }, modalHandle)
            await page.waitForNetworkIdle()
        } catch (e) {
            try {
                const buffer = new Buffer(name, 'utf8')
                fs.writeFile('./fails.txt', buffer)
            } catch (e) {
                console.log("you suck at programming")
            }
        }
    }
    await browser.close()

}

//async function evalListItems(page, UL_SELECTOR, HANDLE_SELECTOR, cb) {
//    await page.waitForSelector(UL_SELECTOR)
//    const handles = await page.$$(HANDLE_SELECTOR)
//    for (const handle of handles) {
//        await cb(handle)
//    }
//}
