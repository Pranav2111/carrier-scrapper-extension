document.addEventListener("DOMContentLoaded", function () {
  const extractButton = document.getElementById("extractButton");
  const textArea = document.getElementById("input-text-area");
  const copyButton = document.getElementById("copy-button");

  copyButton.addEventListener("click", function () {
    textArea.focus();
    textArea.select();
    // textArea.setSelectionRange(0, 99999);
    document.execCommand("copy");
  });

  chrome.storage.local.get("textAreaValue", function (result) {
    if (result.textAreaValue) {
      textArea.value = JSON.stringify(result.textAreaValue);
    }
  });

  // const TButton = document.getElementById("t-button");

  // TButton.addEventListener("click", function () {
  //   const trackingNoField = document.querySelector('.ng2-tag-input__text-input')
  //   trackingNoField.value = 'CN00771500'
  // });

  

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
              swire:{
                "Unload From Vessel0": 'gate_in',
                "Load Onto Vessel1": 'origin_departure',
                "Unload From Vessel2": 'arrival',
                "Load Onto Vessel3": 'gate_out'
              }
            };

            const extractedHTML = document.getElementById(
              "track-booking"
            ).outerHTML;

            async function runGPT(rawHTML) {
              const data = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization:
                      "Add Token",
                  },
                  body: JSON.stringify({
                    model: "gpt-4",
                    messages: [
                      {
                        role: "system",
                        content: "You are a helpful assistant.",
                      },
                      {
                        role: "user",
                        content: `${rawHTML}
                        From above html create me a json of event mapped with dates and location.
                        Format date in IST+05:30 format.
                        
                        The json should be an array of objects having keys  "event_type", "location" and "planned_date"
                        
                        location in should be a string.

                        Provide me a JSON, not code for generating it.`,
                      },
                    ],
                  }),
                }
              );
              const response = await data.json();
              console.log("1 ===========+>", response);
              const formattedData = response?.choices[0]?.message?.content
                ?.split("[")?.[1]
                .split("]")?.[0];
              const realArr = JSON.parse(`[${formattedData}]`);
              console.log("2 ===========+>", realArr);

              realArr.forEach((singleEvent, index) => {
                singleEvent.event_type =
                  carrierEventMap.swire[`${singleEvent.event_type}${index}`];
              });

              return realArr;
            }

            const data1 = await runGPT(extractedHTML);
            chrome.storage.local.set({ textAreaValue: data1 });
            return data1;
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
