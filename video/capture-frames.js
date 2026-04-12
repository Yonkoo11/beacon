#!/usr/bin/env node
/**
 * Capture DISTINCT dashboard frames for demo video.
 * Each frame must be visually different from every other.
 *
 * Usage: node video/capture-frames.js
 */
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRAMES_DIR = path.join(__dirname, 'frames');
const URL = 'http://localhost:3001';

async function main() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Frame 01: Full dashboard overview (1920x1080)
  await page.setViewport({ width: 1920, height: 1080 });
  console.log('Navigating to', URL);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 8000)); // Wait for probe data
  await page.screenshot({ path: path.join(FRAMES_DIR, '01-dashboard.png') });
  console.log('OK 01-dashboard (full page overview)');

  // Frame 02: CROPPED probe feed panel only
  // Find the feed panel element and screenshot just that, then pad to 1920x1080
  const feedPanel = await page.$('.feed-panel');
  if (feedPanel) {
    const feedBox = await feedPanel.boundingBox();
    // Take a focused screenshot: wider area around the feed
    await page.setViewport({ width: 1920, height: 1080 });
    // Scroll so feed is centered
    await page.evaluate(() => {
      const feed = document.querySelector('.feed-panel');
      if (feed) {
        const rect = feed.getBoundingClientRect();
        window.scrollTo(0, rect.top + window.scrollY - 100);
      }
    });
    await new Promise(r => setTimeout(r, 500));

    // Crop to just the right side where feed lives, with some context
    await page.screenshot({
      path: path.join(FRAMES_DIR, '02-feed.png'),
      clip: {
        x: 580,
        y: 140,
        width: 1340,
        height: 940
      }
    });
    console.log('OK 02-feed (cropped feed panel)');
  }

  // Frame 03: CROPPED single endpoint card close-up with sparkline
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));

  // Get the first endpoint card area - zoomed in view
  const firstCard = await page.$('.ep-card');
  if (firstCard) {
    const cardBox = await firstCard.boundingBox();
    // Capture a zoomed area showing 2-3 cards with their sparklines and metrics
    await page.screenshot({
      path: path.join(FRAMES_DIR, '03-scores.png'),
      clip: {
        x: 200,
        y: Math.max(0, cardBox.y - 40),
        width: 750,
        height: 500
      }
    });
    console.log('OK 03-scores (cropped endpoint cards close-up)');
  }

  // Frame 06: Hero section ONLY - just the trust score and description
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({
    path: path.join(FRAMES_DIR, '06-close.png'),
    clip: {
      x: 150,
      y: 0,
      width: 1620,
      height: 200
    }
  });
  console.log('OK 06-close (hero section only)');

  await browser.close();
  console.log('All dashboard frames captured (4 distinct views)');
}

main().catch(err => { console.error(err); process.exit(1); });
