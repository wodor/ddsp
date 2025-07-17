// actions-catalog-test.js
// Playwright test script for the Developer Self-Service Portal Actions Catalog

/**
 * This script tests the functionality of the Actions Catalog UI components:
 * - ActionsFilter
 * - ActionsList
 * - ActionCard
 * 
 * It verifies that:
 * - The page loads correctly
 * - Search functionality works
 * - Category filtering works
 * - Featured actions filtering works
 * - Actions are displayed correctly
 */

import { test, expect } from '@playwright/test';

test('Actions Catalog UI Components', async ({ page }) => {
  // Step 1: Navigate to the Actions page
  await test.step('Navigate to Actions page', async () => {
    await page.goto('http://localhost:5173/actions');
    
    // Verify page title
    await expect(page.locator('h2:has-text("GitHub Actions Catalog")')).toBeVisible();
    
    // Verify refresh button
    await expect(page.getByText('Refresh Catalog')).toBeVisible();
    
    // Verify token warning (when no token is configured)
    await expect(page.getByTestId('token-warning')).toBeVisible();
    await expect(page.getByText('GitHub token not configured.')).toBeVisible();
  });

  // Step 2: Verify filter components are present
  await test.step('Verify filter components', async () => {
    // Verify search input
    await expect(page.getByPlaceholderText('Search actions...')).toBeVisible();
    
    // Verify category filters
    await expect(page.getByText('Deployment')).toBeVisible();
    await expect(page.getByText('Testing')).toBeVisible();
    
    // Verify sort options
    await expect(page.getByTestId('sort-select')).toBeVisible();
    await expect(page.getByTestId('sort-direction-select')).toBeVisible();
    
    // Verify featured checkbox
    await expect(page.getByTestId('featured-checkbox')).toBeVisible();
    await expect(page.getByText('Show featured actions only')).toBeVisible();
  });

  // Step 3: Verify initial actions are displayed
  await test.step('Verify initial actions', async () => {
    // Verify Deploy to S3 action
    await expect(page.getByText('Deploy to S3')).toBeVisible();
    await expect(page.getByText('Deploys static assets to an AWS S3 bucket')).toBeVisible();
    await expect(page.getByText('Featured')).toBeVisible();
    
    // Verify Run Tests action
    await expect(page.getByText('Run Tests')).toBeVisible();
    await expect(page.getByText('Runs the test suite for a project')).toBeVisible();
    
    // Verify tags are displayed
    await expect(page.getByText('aws')).toBeVisible();
    await expect(page.getByText('s3')).toBeVisible();
    await expect(page.getByText('deployment')).toBeVisible();
    await expect(page.getByText('static-site')).toBeVisible();
    await expect(page.getByText('testing')).toBeVisible();
    await expect(page.getByText('ci')).toBeVisible();
  });

  // Step 4: Test search functionality
  await test.step('Test search functionality', async () => {
    // Search for "deploy"
    await page.getByTestId('actions-search-input').fill('deploy');
    
    // Verify only Deploy to S3 action is displayed
    await expect(page.getByText('Deploy to S3')).toBeVisible();
    await expect(page.getByText('Run Tests')).not.toBeVisible();
    
    // Clear search
    await page.getByTestId('actions-search-input').clear();
    
    // Verify both actions are displayed again
    await expect(page.getByText('Deploy to S3')).toBeVisible();
    await expect(page.getByText('Run Tests')).toBeVisible();
  });

  // Step 5: Test category filtering
  await test.step('Test category filtering', async () => {
    // Click on Deployment category
    await page.getByText('Deployment').click();
    
    // Verify only Deploy to S3 action is displayed
    await expect(page.getByText('Deploy to S3')).toBeVisible();
    await expect(page.getByText('Run Tests')).not.toBeVisible();
    
    // Click on Testing category
    await page.getByText('Testing').click();
    
    // Verify only Run Tests action is displayed
    await expect(page.getByText('Deploy to S3')).not.toBeVisible();
    await expect(page.getByText('Run Tests')).toBeVisible();
    
    // Click on Deployment category again to deselect it
    await page.getByText('Deployment').click();
    
    // Click on Testing category again to deselect it
    await page.getByText('Testing').click();
    
    // Verify both actions are displayed again
    await expect(page.getByText('Deploy to S3')).toBeVisible();
    await expect(page.getByText('Run Tests')).toBeVisible();
  });

  // Step 6: Test featured actions filtering
  await test.step('Test featured actions filtering', async () => {
    // Check featured checkbox
    await page.getByTestId('featured-checkbox').check();
    
    // Verify only Deploy to S3 action is displayed
    await expect(page.getByText('Deploy to S3')).toBeVisible();
    await expect(page.getByText('Run Tests')).not.toBeVisible();
    
    // Uncheck featured checkbox
    await page.getByTestId('featured-checkbox').uncheck();
    
    // Verify both actions are displayed again
    await expect(page.getByText('Deploy to S3')).toBeVisible();
    await expect(page.getByText('Run Tests')).toBeVisible();
  });

  // Step 7: Test sorting functionality
  await test.step('Test sorting functionality', async () => {
    // Sort by name
    await page.getByTestId('sort-select').selectOption('name');
    
    // Verify actions are sorted by name (Deploy to S3 should come before Run Tests)
    const actionNames = await page.locator('h3').allTextContents();
    expect(actionNames[0]).toBe('Deploy to S3');
    expect(actionNames[1]).toBe('Run Tests');
    
    // Change sort direction to descending
    await page.getByTestId('sort-direction-select').selectOption('desc');
    
    // Verify actions are sorted by name in descending order (Run Tests should come before Deploy to S3)
    const actionNamesDesc = await page.locator('h3').allTextContents();
    expect(actionNamesDesc[0]).toBe('Run Tests');
    expect(actionNamesDesc[1]).toBe('Deploy to S3');
  });

  // Step 8: Test combined filtering
  await test.step('Test combined filtering', async () => {
    // Reset sort to default
    await page.getByTestId('sort-select').selectOption('');
    
    // Search for "deploy" and select Deployment category
    await page.getByTestId('actions-search-input').fill('deploy');
    await page.getByText('Deployment').click();
    
    // Verify only Deploy to S3 action is displayed
    await expect(page.getByText('Deploy to S3')).toBeVisible();
    await expect(page.getByText('Run Tests')).not.toBeVisible();
    
    // Add featured filter
    await page.getByTestId('featured-checkbox').check();
    
    // Verify Deploy to S3 action is still displayed (it's featured)
    await expect(page.getByText('Deploy to S3')).toBeVisible();
    
    // Clear search and filters
    await page.getByTestId('actions-search-input').clear();
    await page.getByText('Deployment').click(); // deselect
    await page.getByTestId('featured-checkbox').uncheck();
    
    // Verify both actions are displayed again
    await expect(page.getByText('Deploy to S3')).toBeVisible();
    await expect(page.getByText('Run Tests')).toBeVisible();
  });

  // Step 9: Test refresh functionality
  await test.step('Test refresh functionality', async () => {
    // Click refresh button
    await page.getByTestId('refresh-catalog-button').click();
    
    // Verify button text changes to "Refreshing..."
    await expect(page.getByText('Refreshing...')).toBeVisible();
    
    // Wait for refresh to complete
    await expect(page.getByText('Refresh Catalog')).toBeVisible({ timeout: 5000 });
    
    // Verify actions are still displayed
    await expect(page.getByText('Deploy to S3')).toBeVisible();
    await expect(page.getByText('Run Tests')).toBeVisible();
  });

  // Step 10: Test action card click
  await test.step('Test action card click', async () => {
    // This would be implemented in a future task
    // For now, we can just verify the action cards are clickable
    await expect(page.locator(`[data-testid="action-card-deploy-to-s3"]`)).toBeVisible();
    
    // We could add a console.log spy to verify the click handler is called
    // This would require additional setup in the test framework
  });
});