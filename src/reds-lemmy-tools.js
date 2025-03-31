'use strict';
// ==UserScript==
// @name         Red's Lemmy Tools
// @namespace    https://www.redwizard.party
// @version      2025.03.31
// @description  Adds a search button to URL posts to find where else it's posted, and highlights posts from external communities. 
// @author       RedWizard@hexbear.net
// @match        *://hexbear.net/*
// @grant        none
// ==/UserScript==

function highlightExternalPosts(post) {
    const currentInstance = window.location.hostname;
    if (post.dataset.processedExternal) return;
    post.dataset.processedExternal = 'true';

    const communityLink = post.querySelector('a[href^="/c/"]');
    if (!communityLink) return;

    const communityUrl = communityLink.href;
    let instance;
    try {
        const path = new URL(communityUrl).pathname;
        if (!path.includes('@')) return;
        instance = path.split('@')[1];
    } catch (e) {
        return;
    }

    if (instance && instance !== currentInstance) {
        post.classList.add('external-instance-post');

        // Add instance label if missing
        if (!post.querySelector('.external-instance-label')) {
            const label = document.createElement('span');
            label.className = 'external-instance-label';
            label.textContent = `🚀 ${instance}`;
            communityLink.parentNode.insertBefore(label, communityLink.nextSibling);
        }

        // Add search button if post has a URL
        addSearchButton(post);
    }
}

function addSearchButton(post) {
    post.dataset.processedSearch = 'true';

    // Check if button already exists
    if (post.querySelector('.search-external-url-btn')) return;

    // Find the URL link in post actions
    const urlLink = post.querySelector('a[class~="thumbnail"], a[class="text-body"][target="_blank"]');
    if (!urlLink) return;

    const postUrl = urlLink.href;

    // Create search button
    const searchBtn = document.createElement('button');
    searchBtn.className = 'btn btn-sm btn-link text-warning search-external-url-btn';
    searchBtn.innerHTML = `
<svg class="icon"><use xlink:href="/static/e512d283/assets/symbols.svg#icon-search"></use><div class="visually-hidden"><title>search</title></div></svg>
  <span class="d-inline ms-1 d-md-none ms-md-0">Search</span></a>
    `;

    // Add click handler
    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const searchUrl = `https://hexbear.net/search?q=${encodeURIComponent(postUrl)}&type=Url`;
        window.open(searchUrl, '_blank');
    });

    // Find action buttons container
    const actionContainer = post.querySelector('.hexbear-mobileActionLine, .d-flex.align-items-center.justify-content-start');
    if (actionContainer) {
        // Insert before "More" dropdown if possible
        const moreBtn = actionContainer.querySelector('.dropdown');
        if (moreBtn) {
            actionContainer.insertBefore(searchBtn, moreBtn);
        } else {
            actionContainer.appendChild(searchBtn);
        }
    }
}

function collapseSubscribedSidebar() {
    const sidebar = document.getElementById('sidebarSubscribed');
    if (!sidebar) return;

    // Find the collapse button in the header
    const collapseButton = sidebar.querySelector('#sidebarSubscribedHeader button[aria-label="Collapse"]');
    if (!collapseButton) return;

    // Check if it's already collapsed
    const isExpanded = collapseButton.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
        // Simulate click to collapse
        collapseButton.click();

        // Update button icon to plus-square (collapsed state)
        const iconUse = collapseButton.querySelector('use');
        if (iconUse) {
            iconUse.setAttribute('xlink:href', '/static/a0316528/assets/symbols.svg#icon-plus-square');
        }
    }
}

(function() {
    'use strict';

    // Add updated styles
    const style = document.createElement('style');
    style.textContent = `
        .external-instance-post {
            background-color: #2f2f37;
            border-radius: 0.25rem;
        }
        .external-instance-label {
            color: #ff9900;
            font-size: 0.8em;
            margin-left: 5px;
            font-weight: bold;
        }
        .search-external-url-btn {
            color: #ff9900 !important;
            padding: 0 0.5rem !important;
        }
        .search-external-url-btn:hover {
            color: #ffcc80 !important;
        }
        .search-external-url-btn svg {
            margin-right: 3px;
        }
    `;
    document.head.appendChild(style);

    // Initial run
    document.querySelectorAll('.post-container:not([data-processedExternal])').forEach(post => {
        highlightExternalPosts(post);
    });
    collapseSubscribedSidebar();

    // Enhanced observer
    const observer = new MutationObserver(mutations => {
        // Close the Subscribed Sidebar
        if (!document.getElementById('sidebarSubscribed')) {
            collapseSubscribedSidebar();
        }

        // Process External Posts
        document.querySelectorAll('.post-container:not([data-processedExternal])').forEach(post => {
            highlightExternalPosts(post);
        });

        // Process Posts with External URLs
        document.querySelectorAll('.post-container:not([data-processedSearch])').forEach(post => {
            addSearchButton(post);

        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();