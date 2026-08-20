#!/bin/bash
# Simulate opening the dropdown: dispatch a click on the trigger via a temp bookmarklet page is complex.
# Instead, use chromium with a small user script? Use node: check if puppeteer available.
node -e "try { require.resolve('puppeteer'); console.log('have'); } catch(e) { console.log('none'); }"
