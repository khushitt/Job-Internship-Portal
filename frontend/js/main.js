// ============================================
// CareerConnect - Main JavaScript
// ============================================

const API_BASE_URL = "http://localhost:5000/api";

// ============================================
// SMART JOB SEARCH
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("jobSearchInput");
    const searchButton = document.getElementById("searchJobsButton");
    const jobsContainer = document.getElementById("jobsContainer");
    const messageContainer = document.getElementById("jobsMessage");

    // This script is also loaded by pages other than jobs.html.
    // Do nothing on those pages.
    if (!jobsContainer) {
        return;
    }

    let allJobs = [];

    // Load jobs from the backend
    async function loadJobs() {
        try {
            showMessage("Loading jobs...");

            const response = await fetch(`${API_BASE_URL}/jobs`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not load jobs.");
            }

            allJobs = Array.isArray(data)
                ? data
                : Array.isArray(data.jobs)
                    ? data.jobs
                    : [];

            displayJobs(allJobs);
        } catch (error) {
            console.error("Error loading jobs:", error);
            showMessage(
                "Could not load jobs. Please check that your backend is running."
            );
        }
    }

    // Display jobs
    function displayJobs(jobs) {
        jobsContainer.innerHTML = "";

        if (jobs.length === 0) {
            showMessage("No matching jobs found. Try another search.");
            return;
        }

        if (messageContainer) {
            messageContainer.textContent = "";
            messageContainer.style.display = "none";
        }

        jobs.forEach((job) => {
            const card = document.createElement("article");
            card.className = "job-card";

            const title = document.createElement("h3");
            title.textContent = job.title || "Untitled Job";

            const company = document.createElement("p");
            company.textContent = `Company: ${job.company_name || "Not specified"}`;

            const location = document.createElement("p");
            location.textContent = `Location: ${job.location || "Not specified"}`;

            const jobType = document.createElement("p");
            jobType.textContent = `Type: ${job.job_type || "Not specified"}`;

            const skills = document.createElement("p");
            skills.textContent = `Skills: ${job.skills_required || "Not specified"}`;

            const salary = document.createElement("p");
            salary.textContent = `Salary: ${job.salary || "Not specified"}`;

            card.append(title, company, location, jobType, skills, salary);
            jobsContainer.appendChild(card);
        });
    }

    // Show a message on the page
    function showMessage(message) {
        if (messageContainer) {
            messageContainer.textContent = message;
            messageContainer.style.display = "block";
        } else {
            jobsContainer.textContent = message;
        }
    }

    // Search by title, company, location, skills, or job type
    function searchJobs() {
        const query = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        if (!query) {
            displayJobs(allJobs);
            return;
        }

        const filteredJobs = allJobs.filter((job) => {
            const searchableText = [
                job.title,
                job.company_name,
                job.location,
                job.skills_required,
                job.job_type,
                job.description
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(query);
        });

        displayJobs(filteredJobs);
    }

    // Search button
    if (searchButton) {
        searchButton.addEventListener("click", searchJobs);
    }

    // Press Enter to search
    if (searchInput) {
        searchInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                searchJobs();
            }
        });

        // Show matching results as the user types
        searchInput.addEventListener("input", searchJobs);
    }

    // Load jobs when the page opens
    loadJobs();
});