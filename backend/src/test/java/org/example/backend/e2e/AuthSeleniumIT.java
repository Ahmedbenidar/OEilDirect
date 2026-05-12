package org.example.backend.e2e;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.ElementClickInterceptedException;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthSeleniumIT {

    private WebDriver driver;

    private static void pauseMs(long ms) {
        if (ms <= 0) return;
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static void clickWithScrollAndFallback(WebDriver driver, WebDriverWait wait, By locator) {
        WebElement el;
        try {
            el = wait.until(ExpectedConditions.elementToBeClickable(locator));
        } catch (TimeoutException e) {
            el = wait.until(ExpectedConditions.presenceOfElementLocated(locator));
        }

        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({block:'center', inline:'center'});", el
        );

        try {
            wait.until(ExpectedConditions.elementToBeClickable(el)).click();
        } catch (ElementClickInterceptedException e) {
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", el);
        }
    }

    private static void clickButtonByText(WebDriver driver, WebDriverWait wait, String buttonText) {
        By locator = By.xpath("//button[contains(normalize-space(.), " + toXpathStringLiteral(buttonText) + ")]");
        clickWithScrollAndFallback(driver, wait, locator);
    }

    private static String toXpathStringLiteral(String s) {
        // Minimal escaping so we can match text with quotes if needed
        if (!s.contains("'")) return "'" + s + "'";
        if (!s.contains("\"")) return "\"" + s + "\"";
        String[] parts = s.split("'");
        StringBuilder sb = new StringBuilder("concat(");
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) sb.append(", \"'\", ");
            sb.append("'").append(parts[i]).append("'");
        }
        sb.append(")");
        return sb.toString();
    }

    private static WebElement firstPresent(WebDriverWait wait, List<By> locators) {
        TimeoutException last = null;
        for (By locator : locators) {
            try {
                return wait.until(ExpectedConditions.presenceOfElementLocated(locator));
            } catch (TimeoutException e) {
                last = e;
            }
        }
        throw last != null ? last : new TimeoutException("No locator matched");
    }

    private static void goToMonth(WebDriver driver, WebDriverWait wait, String targetMonth, int targetYear, long slowMs) {
        // CalendrierDispo header: "<MOIS> <YEAR>" e.g. "Mai 2026"
        By header = By.cssSelector("h3.text-sm.font-bold.text-slate-800");
        By next = By.xpath("//button[.//span[normalize-space(.)='chevron_right']]");
        By prev = By.xpath("//button[.//span[normalize-space(.)='chevron_left']]");

        String desired = targetMonth + " " + targetYear;
        String h = wait.until(ExpectedConditions.presenceOfElementLocated(header)).getText().trim();
        int guard = 24;
        while (!h.equalsIgnoreCase(desired) && guard-- > 0) {
            // Simple heuristic: if year differs or month not equal, click next until match; fallback to prev if we overshoot.
            // (In practice for your use-case, May is usually forward from current month.)
            clickWithScrollAndFallback(driver, wait, next);
            pauseMs(slowMs);
            h = wait.until(ExpectedConditions.presenceOfElementLocated(header)).getText().trim();

            if (guard == 12 && !h.equalsIgnoreCase(desired)) {
                // if still not found after 12 next clicks, try going backward
                clickWithScrollAndFallback(driver, wait, prev);
                pauseMs(slowMs);
                h = wait.until(ExpectedConditions.presenceOfElementLocated(header)).getText().trim();
            }
        }
        assertTrue(h.equalsIgnoreCase(desired), "Calendar month not reached. Current header=" + h);
    }

    private static void pickDayInCalendar(WebDriver driver, WebDriverWait wait, int day, long slowMs) {
        // Pick the day button inside CalendrierDispo grid (not disabled)
        By dayBtn = By.xpath("//button[normalize-space(.)='" + day + "' and not(@disabled)]");
        clickWithScrollAndFallback(driver, wait, dayBtn);
        pauseMs(slowMs);
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    void inscriptionPuisConnexion_patient() {
        // Prereq:
        // - Frontend Next.js running (default http://localhost:3000)
        // - Backend Spring running (front calls http://localhost:8081/api)
        //
        // ChromeDriver:
        // - provide -Dwebdriver.chrome.driver=... OR keep default below
        String chromeDriverPath = System.getProperty("webdriver.chrome.driver", "C:\\chromedriver.exe");
        System.setProperty("webdriver.chrome.driver", chromeDriverPath);

        String baseUrl = System.getProperty("app.baseUrl", "http://localhost:3000");

        ChromeOptions options = new ChromeOptions();
        if (Boolean.parseBoolean(System.getProperty("selenium.headless", "false"))) {
            options.addArguments("--headless=new");
        }
        options.addArguments("--window-size=1280,900");

        driver = new ChromeDriver(options);
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        long slowMs = Long.parseLong(System.getProperty("selenium.slowMs", "800"));

        String email = "selenium+" + Instant.now().toEpochMilli() + "@test.com";
        String password = "password123";

        // 1) Registration
        driver.get(baseUrl + "/inscription");
        pauseMs(slowMs);
        wait.until(ExpectedConditions.presenceOfElementLocated(By.id("nom"))).sendKeys("Selenium User");
        driver.findElement(By.id("email")).sendKeys(email);
        driver.findElement(By.id("motDePasse")).sendKeys(password);
        driver.findElement(By.id("confirmer")).sendKeys(password);
        clickWithScrollAndFallback(driver, wait, By.cssSelector("form button[type='submit']"));
        pauseMs(slowMs);

        // Redirect to /connexion
        wait.until(d -> d.getCurrentUrl().contains("/connexion"));

        // 2) Login
        pauseMs(slowMs);
        wait.until(ExpectedConditions.presenceOfElementLocated(By.id("email"))).clear();
        driver.findElement(By.id("email")).sendKeys(email);
        driver.findElement(By.id("motDePasse")).sendKeys(password);
        clickWithScrollAndFallback(driver, wait, By.cssSelector("form button[type='submit']"));
        pauseMs(slowMs);

        // PATIENT role redirects to /patient
        wait.until(ExpectedConditions.urlContains("/patient"));
        assertTrue(driver.getCurrentUrl().contains("/patient"));

        // 3) Appointment booking via /patient/medecins -> /patient/reserver/{id} -> payment
        driver.get(baseUrl + "/patient/medecins");
        pauseMs(slowMs);
        wait.until(ExpectedConditions.urlContains("/patient/medecins"));

        // Click "Prendre RDV" on the first card to navigate to /patient/reserver/{id}
        clickButtonByText(driver, wait, "Prendre RDV");
        pauseMs(slowMs);
        wait.until(ExpectedConditions.urlContains("/patient/reserver/"));

        // Step 1 (reserver): pick May 13 (in the currently displayed year)
        int targetYear = Integer.parseInt(System.getProperty("selenium.targetYear", String.valueOf(java.time.Year.now().getValue())));
        goToMonth(driver, wait, "Mai", targetYear, slowMs);
        pickDayInCalendar(driver, wait, 13, slowMs);

        // pick a time slot: choose the first enabled among known slots
        WebElement timeButton = firstPresent(wait, List.of(
                By.xpath("//button[normalize-space(.)='09:00' and not(@disabled)]"),
                By.xpath("//button[normalize-space(.)='09:30' and not(@disabled)]"),
                By.xpath("//button[normalize-space(.)='10:00' and not(@disabled)]"),
                By.xpath("//button[normalize-space(.)='10:30' and not(@disabled)]"),
                By.xpath("//button[normalize-space(.)='11:00' and not(@disabled)]"),
                By.xpath("//button[normalize-space(.)='14:00' and not(@disabled)]"),
                By.xpath("//button[normalize-space(.)='14:30' and not(@disabled)]"),
                By.xpath("//button[normalize-space(.)='15:00' and not(@disabled)]"),
                By.xpath("//button[normalize-space(.)='15:30' and not(@disabled)]"),
                By.xpath("//button[normalize-space(.)='16:00' and not(@disabled)]")
        ));
        ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'});", timeButton);
        timeButton.click();
        pauseMs(slowMs);

        // motif select
        WebElement motifSelect = wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("select")));
        new Select(motifSelect).selectByVisibleText("Baisse de vision progressive");
        pauseMs(slowMs);

        // Continue to payment step
        clickButtonByText(driver, wait, "Confirmer le rendez-vous");
        pauseMs(slowMs);

        // Step 2 (payment): fill card form and pay
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("input[placeholder='0000 0000 0000 0000']")))
                .sendKeys("4242 4242 4242 4242");
        driver.findElement(By.cssSelector("input[placeholder='JEAN DUPONT']")).sendKeys("SELENIUM USER");
        driver.findElement(By.cssSelector("input[placeholder='MM/AA']")).sendKeys("12/30");
        driver.findElement(By.cssSelector("input[placeholder='•••']")).sendKeys("123");
        pauseMs(slowMs);

        clickButtonByText(driver, wait, "Payer");
        pauseMs(slowMs);

        // Success screen
        wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("//*[contains(., 'Rendez-vous confirmé')]")));
    }
}

