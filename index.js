let extractedHTML;

document.addEventListener("DOMContentLoaded", function() {
  const extractButton = document.getElementById("extractButton");
  const resultDiv = document.getElementById("result");

  extractButton.addEventListener("click", function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];
      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          function: () => {
            extractedHTML = document.getElementById('multiresultssection').outerHTML
            return extractedHTML;
          },
        },
        (results) => {
          const html = results[0].result;
          resultDiv.textContent = html;
        }
      );
    });
  });
});
