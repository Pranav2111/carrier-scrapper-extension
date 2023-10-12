document.addEventListener("DOMContentLoaded", function () {
  const extractButton = document.getElementById("extractButton");
  const textArea = document.getElementById("input-text-area");
  const copyButton = document.getElementById("copy-button");

  copyButton.addEventListener("click", function () {
    textArea.focus();
    textArea.select();
    document.execCommand("copy");
  });

  chrome.storage.local.get("textAreaValue", function (result) {
    if (result.textAreaValue) {
      textArea.value = JSON.stringify(result.textAreaValue);
    }
  });

  extractButton.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];
      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          function: async () => {
            const carrierEventMap = {
              cma: {
                "Empty to shipper": "empty_pickup",
                "Ready to be loaded": "ready_to_load",
                "Loaded on board": "ready_on_board",
                "Vessel Departure": "origin_departure",
                "Vessel Arrival": "arrival",
              },
              swire: {
                "Unload From Vessel0": "gate_in",
                "Load Onto Vessel1": "origin_departure",
                "Unload From Vessel2": "arrival",
                "Load Onto Vessel3": "gate_out",
              },
            };

            const extractedHTML =
              document.getElementById("track-booking").outerHTML;

            const parser = new DOMParser();
            const doc = parser.parseFromString(extractedHTML, "text/html");

            const dateElements = doc.querySelectorAll(
              ".Text-90.paragraph-regular-14"
            );

            const locationElements = doc.querySelectorAll(
              ".Text-90.paragraph-regular-15"
            );

            const eventElements = doc.querySelectorAll(
              ".paragraph-semibold-16.Text-90.same-span"
            );

            const events = [];

            // Loop through the elements and create JSON objects
            for (let i = 0; i < dateElements.length; i++) {
              const event = {
                event_type: eventElements[i].textContent,
                location: locationElements[i].textContent,
                planned_date: new Date(
                  dateElements[i].textContent
                ).toISOString(),
              };
              events.push(event);
            }

            const resultJSON = JSON.stringify(events, null, 2);

            const parse = JSON.parse(resultJSON);

            parse.forEach((singleEvent, index) => {
              singleEvent.event_type =
                carrierEventMap.swire[`${singleEvent.event_type}${index}`];
            });

            console.log("resultJSON2", parse);

            chrome.storage.local.set({ textAreaValue: parse });
            return parse;
          },
        },
        (results) => {
          const data = results[0].result;
          textArea.value = JSON.stringify(data);
        }
      );
    });
  });
});
