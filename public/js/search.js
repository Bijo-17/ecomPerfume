

  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  const searchWrapper = document.querySelector('.header-search-wrapper');
  const clearBtn = document.getElementById('clearSearchBtn');
  const searchSubmitBtn = document.getElementById('searchSubmitBtn');



  // Toggle search bar visibility
  searchBtn.addEventListener('click', () => {

    searchWrapper.classList.toggle('active');
    if (searchWrapper.classList.contains('active')) {
      searchInput.focus();
    }
  });

  // Show/hide clear button
  searchInput.addEventListener('input', () => {
    clearBtn.style.display = searchInput.value.trim() !== '' ? 'block' : 'none';
  });

  // Clear search input
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    searchInput.focus();
  });

  // Optional: handle search trigger
  searchSubmitBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      // Redirect to search results or handle search logic
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  });

  document.addEventListener('click', (e) => {
  if (!searchWrapper.contains(e.target) && !searchBtn.contains(e.target)) {
    searchWrapper.classList.remove('active');
  }
});

