// scripts/index.js

const plusOneSelect = document.querySelector('select[name="plusOne"]');
const plusOneContainer = document.querySelector(".plus-one");
const plusOneInputs = plusOneContainer.querySelectorAll("input");
const amountDisplay = document.querySelector(".amount");
const form = document.querySelector("form");

const baseAmount = 2040;
const plusOneAmount = 4080;

const inputFields = document.querySelectorAll("input");

function checkScriptInjection(inputValue) {
  const scriptTagRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  return scriptTagRegex.test(inputValue);
}

function hasNumbers(inputValue) {
  return /\d/.test(inputValue);
}

function handleScriptInjectionDetected(inputElement) {
  console.warn("Script injection detected!");
  alert("Script tags are not allowed.");
  inputElement.value = "";
}

function handleNumbersDetected(inputElement) {
  console.warn("Numbers detected in name field!");
  alert("Names cannot contain numbers.");
  inputElement.value = inputElement.value.replace(/\d/g, "");
}

function handleSpecialCharactersDetected(inputElement) {
  alert("Please avoid using special characters in this field.");
  inputElement.value = inputElement.value.replace(/[^a-zA-Z\s]/g, "");
}

inputFields.forEach((input) => {
  input.addEventListener("input", function () {
    if (this.value.includes("<") || this.value.includes(">")) {
      alert("The characters '<' and '>' are not allowed.");
      this.value = this.value.replace(/[<>]/g, "");
    }
    if (checkScriptInjection(this.value)) {
      handleScriptInjectionDetected(this);
    }

    if (this.name === "name" || this.name === "plusOneName") {
      if (hasNumbers(this.value)) {
        handleNumbersDetected(this);
      }
      if (/[^a-zA-Z\s]/.test(this.value)) {
        handleSpecialCharactersDetected(this);
      }
    }
  });
});

plusOneSelect.addEventListener("change", (event) => {
  if (event.target.value === "true") {
    plusOneContainer.style.display = "flex";
    setTimeout(() => {
      plusOneContainer.classList.add("show");
      plusOneInputs.forEach((input) => (input.required = true));
    }, 10);
    amountDisplay.textContent = `৳${plusOneAmount}`;
  } else {
    plusOneContainer.classList.remove("show");
    plusOneContainer.style.display = "none";
    plusOneInputs.forEach((input) => (input.required = false));
    amountDisplay.textContent = `৳${baseAmount}`;
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const nameInput = document.querySelector('input[name="name"]');
  const numberInput = document.querySelector('input[name="number"]');
  const transactionIDInput = document.querySelector(
    'input[name="transactionID"]'
  );
  const plusOneNameInput = document.querySelector('input[name="plusOneName"]');

  const dueAmountText = amountDisplay.textContent;
  const dueAmount = parseInt(dueAmountText.replace("৳", ""));

  if (plusOneSelect.value === "true" && !plusOneNameInput.value.trim()) {
    alert("Please fill out the name for your plus one.");
    return;
  }

  const payload = {
    name: nameInput.value,
    number: numberInput.value,
    plusOne: plusOneSelect.value === "true",
    plusOneName: plusOneSelect.value === "true" ? plusOneNameInput.value : null,
    transactionID: transactionIDInput.value,
    dueAmount: dueAmount,
  };

  fetch("/api/tokens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((data) => {
          throw new Error(data.message || "Registration failed");
        });
      }
      return response.json();
    })
    .then((data) => {
      window.location.href = `/success?txid=${data.transactionID}`;
    })
    .catch((error) => {
      alert(`A network error occurred: ${error.message}. Please try again.`);
      console.error("Error submitting form:", error);
    });
});
