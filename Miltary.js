   <!-- 3. Military Search -->
            <section class="search-section">
                <h2>Military Search</h2>
                <form id="military-search-form">
                    <label for="military-branch">Military Branch:</label>
                    <select id="military-branch" name="military-branch" required>
                        <option value="">Select a Branch</option>
                        <option value="all">All</option>
                        <option value="Army">Army</option>
                        <option value="Navy">Navy</option>
                        <option value="Air Force">Air Force</option>
                        <option value="Marine Corps">Marine Corps</option>
                        <option value="Coast Guard">Coast Guard</option>
                    </select>
                    <label for="moc">Military Occupational Code (MOC):</label>
                    <input type="text" id="moc" name="moc" required placeholder="Enter MOC, e.g.: 11B">
                    <button type="submit">Search</button>
                </form>
            </section>
        </div>  <div class="clear-all-container">
            <button onclick="clearAllResults()" class="clear-all-btn">Clear All Results</button>
        </div>
        <div id="military-results" class="results">
            <h3 class="results-header">Military Search Results</h3>
        </div>  <script>
            // Update API endpoints to match server.js
            const API_URL = '/api';
    
            // Add timeout handling
            async function fetchWithTimeout(resource, options = {}) {
                const timeout = options.timeout || 8000; // 8 seconds timeout
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), timeout);
                
                try {
                    const response = await fetch(resource, {
                        ...options,
                        signal: controller.signal
                    });
                    clearTimeout(id);
                    return response;
                } catch (error) {
                    clearTimeout(id);
                    if (error.name === 'AbortError') {
                        throw new Error('Request timed out');
                    }
                    throw error;
                }
            }
    
            /**
             * Load industry listing when page loads
             */
            document.addEventListener('DOMContentLoaded', async () => {
                const industrySelect = document.getElementById('industry');
                try {
                    const response = await fetchWithTimeout(`${API_URL}/industries`);
                    if (!response.ok) throw new Error('Failed to fetch industries');
                    const data = await response.json();
    
                    data.industry.forEach(ind => {
                        const option = document.createElement('option');
                        option.value = ind.code;
                        option.textContent = ind.title;
                        industrySelect.appendChild(option);
                    });
                } catch (error) {
                    console.error(error);
                    industrySelect.innerHTML = '<option value="">Error loading industries</option>';document.getElementById('military-search-form').addEventListener('submit', async function(e) {
                        e.preventDefault();
                        const branch = document.getElementById('military-branch').value;
                        const moc = document.getElementById('moc').value.trim();
                        const resultsDiv = document.getElementById('military-results');
                        resultsDiv.innerHTML = '<div class="loading"></div>';
            
                        try {
                            const response = await fetchWithTimeout(
                                `${API_URL}/military/search?keyword=${encodeURIComponent(moc)}`
                            );
                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || 'Request failed');
                            }
                            const data = await response.json();
            
                            let filteredCareers = data.career;
                            if (branch !== 'all') {
                                filteredCareers = data.career.filter(career => 
                                    career.military_jobs[branch.toLowerCase().replace(' ', '_')]
                                );
                            }
            
                            displayCareers(filteredCareers, resultsDiv);
                        } catch (error) {
                            console.error(error);
                            resultsDiv.innerHTML = `
                                <button class="close-results" onclick="clearResults(this)">×</button>
                                <div class="no-results">Error: ${error.message}</div>
                            `;
                        }
                    });
            
                    /**
                     * Display careers in the DOM
                     */
                    function displayCareers(careers, container) {
                        if (!careers || careers.length === 0) {
                            container.innerHTML = `
                                <h3 class="results-header">${getResultsTitle(container.id)}</h3>
                                <button class="close-results" onclick="clearResults(this)">×</button>
                                <div class="no-results">No careers found.</div>
                            `;
                            return;
                        }
            
                        const displayedCareers = careers.slice(0, 5);
                        
                        let html = `
                            <h3 class="results-header">${getResultsTitle(container.id)}</h3>
                            <button class="close-results" onclick="clearResults(this)">×</button>
                        `;
                        displayedCareers.forEach(career => {
                            html += `
                                <div class="career">
                                    <h3>${career.title}</h3>
                                    <p><strong>O*NET Code:</strong> ${career.code}</p>
                                    ${career.percent_employed ? `<p><strong>Percent Employed:</strong> ${career.percent_employed}%</p>` : ''}
                                    ${career.preparation_needed ? `<p><strong>Preparation Needed:</strong> ${career.preparation_needed}</p>` : ''}
                                    ${career.pay_grade ? `<p><strong>Pay Grade:</strong> ${career.pay_grade}</p>` : ''}
                                    <p><strong>Tags:</strong> ${formatTags(career.tags)}</p>
                                    <p><strong>Military Branch Careers:</strong> ${formatMilitaryJobs(career.military_jobs)}</p>
                                    <a href="${career.href}" target="_blank">More Information</a>
                                </div>
                            `;
                        });
            
                        if (careers.length > 5) {
                            html += `
                                <div class="pagination">
                                    <button onclick="showAllResults(this)" data-all-results='${JSON.stringify(careers)}'>
                                        See More (${careers.length - 5} more results)
                                    </button>
                                </div>
                            `;
                        }
            
                        container.innerHTML = html;
                    }
            
                    /**
                     * Format tags for display
                     */
                    function formatTags(tags) {
                        const formatted = [];
                        if (tags.bright_outlook) formatted.push('Bright Outlook');
                        if (tags.green) formatted.push('Green');
                        if (tags.apprenticeship) formatted.push('Registered Apprenticeship');
                        return formatted.join(', ') || 'None';
                    }
            
                    /**
                     * Format military jobs for display
                     */
                    function formatMilitaryJobs(militaryJobs) {
                        const branches = [];
                        for (const [key, value] of Object.entries(militaryJobs)) {
                            if (value) {
                                const formattedKey = key.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
                                branches.push(formattedKey);
                            }
                        }
                        return branches.join(', ') || 'None';
                    }
            
                    // Add this new function to handle showing all results
                    function showAllResults(button) {
                        const allResults = JSON.parse(button.dataset.allResults);
                        const container = button.closest('.results');
                        let html = `
                            <h3 class="results-header">${getResultsTitle(container.id)}</h3>
                            <button class="close-results" onclick="clearResults(this)">×</button>
                        `;
                        
                        allResults.forEach(career => {
                            html += `
                                <div class="career">
                                    <h3>${career.title}</h3>
                                    <p><strong>O*NET Code:</strong> ${career.code}</p>
                                    ${career.percent_employed ? `<p><strong>Percent Employed:</strong> ${career.percent_employed}%</p>` : ''}
                                    ${career.preparation_needed ? `<p><strong>Preparation Needed:</strong> ${career.preparation_needed}</p>` : ''}
                                    ${career.pay_grade ? `<p><strong>Pay Grade:</strong> ${career.pay_grade}</p>` : ''}
                                    <p><strong>Tags:</strong> ${formatTags(career.tags)}</p>
                                    <p><strong>Military Branch Careers:</strong> ${formatMilitaryJobs(career.military_jobs)}</p>
                                    <a href="${career.href}" target="_blank">More Information</a>
                                </div>
                            `;
                        });
            
                        // Add "Show Less" button
                        html += `
                            <div class="pagination">
                                <button onclick="showLessResults(this, allResults)">Show Less</button>
                            </div>
                        `;
            
                        container.innerHTML = html;
                    }
            
                    // Add this function to handle showing less results
                    function showLessResults(button, allResults) {
                        const container = button.closest('.results');
                        displayCareers(allResults, container);
                    }
            
                    // Add keyboard navigation
                    document.addEventListener('keydown', function(e) {
                        if (e.key === 'Escape') {
                            const activeResults = document.querySelector('.results:not(:empty)');
                            if (activeResults) {
                                const closeButton = activeResults.querySelector('.close-results');
                                if (closeButton) closeButton.click();
                            }
                        }
                    });
            
                    // Clear results functions
                    function clearResults(button) {
                        const container = button.closest('.results');
                        container.innerHTML = '';
                        
                        // Reset the corresponding form
                        if (container.id === 'keyword-results') {
                            document.getElementById('keyword-search-form').reset();
                        } else if (container.id === 'industry-results') {
                            document.getElementById('industry-search-form').reset();
                        } else if (container.id === 'military-results') {
                            document.getElementById('military-search-form').reset();
                        }
                    }
            
                    function clearAllResults() {
                        document.querySelectorAll('.results').forEach(container => {
                            container.innerHTML = '';
                        });
                        document.querySelectorAll('form').forEach(form => {
                            form.reset();
                        });
                    }
            
                    // Add this helper function to get the appropriate title
                    function getResultsTitle(containerId) {
                        switch(containerId) {
                            case 'keyword-results':
                                return 'Keyword Search Results';
                            case 'industry-results':
                                return 'Industry Search Results';
                            case 'military-results':
                                return 'Military Search Results';
                            default:
                                return 'Search Results';
                        }
                    }
                </script>
            </body>
            </html>