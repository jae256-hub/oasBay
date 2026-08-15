//Fetch the local JSON file
fetch("/inventory.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("HTTP error" + response.status);
    }
    return response.json();
  })
  .then((data) => {
    console.log(data);
  })
  .catch((error) => {
    console.error("Error fetching inventory data:", error);
  });
parse.json("/inventory.json");
