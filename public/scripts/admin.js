document.addEventListener("DOMContentLoaded", () => {
    const pendingTableBody = document.querySelector("#pending-table tbody");
    const approvedTableBody = document.querySelector("#approved-table tbody");
    const pendingEmptyState = document.getElementById("pending-container");
    const approvedEmptyState = document.getElementById("approved-container");
    const searchBar = document.getElementById("search-bar");
    const searchResultsSection = document.getElementById(
        "search-results-section"
    );
    const searchResultsContainer = document.getElementById(
        "search-results-container"
    );
    const searchEmptyState = document.getElementById("search-empty-state");

    let allTokens = [];

    async function fetchTokens() {
        try {
            const response = await fetch("/api/tokens");
            const tokens = await response.json();
            allTokens = tokens;
            renderMainTables(tokens);
        } catch (error) {
            console.error("Error fetching tokens:", error);
            pendingEmptyState.textContent = "Error loading tokens.";
            approvedEmptyState.textContent = "Error loading tokens.";
        }
    }

    function renderMainTables(tokens) {
        pendingTableBody.innerHTML = "";
        approvedTableBody.innerHTML = "";

        const pendingTokens = tokens.filter((token) => !token.isApproved);
        const approvedTokens = tokens.filter((token) => token.isApproved);

        if (pendingTokens.length > 0) {
            pendingTokens.forEach((token, index) =>
                renderTokenRow(token, pendingTableBody, index + 1)
            );
            pendingEmptyState.style.display = "none";
        } else {
            pendingEmptyState.style.display = "block";
        }

        if (approvedTokens.length > 0) {
            approvedTokens.forEach((token, index) =>
                renderTokenRow(token, approvedTableBody, index + 1)
            );
            approvedEmptyState.style.display = "none";
        } else {
            approvedEmptyState.style.display = "block";
        }
    }

    function renderTokenRow(token, tableBody, serialNumber) {
        const row = document.createElement("tr");
        row.setAttribute("data-transaction-id", token.transactionID);

        row.innerHTML = `
                        <td data-label="Sl.">${serialNumber}</td>
                        <td data-label="Name">${token.name}</td>
                        <td data-label="Contact">${token.number}</td>
                        <td data-label="TXID">${token.transactionID}</td>
                        <td data-label="+1">${token.plusOne ? "Yes" : "No"}</td>
                        <td data-label="+1 Name">${
                            token.plusOne ? token.plusOneName : "N/A"
                        }</td>
                        <td data-label="${token.isApproved ? "Paid" : "Due"}">৳${
            token.dueAmount
        }</td>
                        <td data-label="Actions">
                            <div class="action-buttons">
                                ${
                                    token.isApproved
                                        ? `<button class="revoke-btn" data-action="revoke">Revoke</button>`
                                        : `<button class="approve-btn" data-action="approve">Approve</button>
                                       <button class="delete-btn" data-action="delete">Delete</button>`
                                }
                            </div>
                        </td>
                    `;

        tableBody.appendChild(row);

        const approveButton = row.querySelector(".approve-btn");
        const deleteButton = row.querySelector(".delete-btn");
        const revokeButton = row.querySelector(".revoke-btn");

        if (approveButton) {
            approveButton.addEventListener("click", () =>
                approveToken(token.transactionID)
            );
        }
        if (deleteButton) {
            deleteButton.addEventListener("click", () =>
                deleteToken(token.transactionID)
            );
        }
        if (revokeButton) {
            revokeButton.addEventListener("click", () =>
                revokeToken(token.transactionID)
            );
        }
    }

    function displaySearchResults() {
        const searchTerm = searchBar.value.toLowerCase().trim();
        searchResultsContainer.innerHTML = "";

        if (searchTerm.length > 0) {
            searchResultsSection.style.display = "block";
            const filteredTokens = allTokens.filter(
                (token) =>
                    token.name.toLowerCase().includes(searchTerm) ||
                    token.number.toLowerCase().includes(searchTerm) ||
                    token.transactionID.toLowerCase().includes(searchTerm)
            );

            if (filteredTokens.length > 0) {
                searchEmptyState.style.display = "none";
                filteredTokens.forEach((token) => {
                    const card = document.createElement("div");
                    card.classList.add(
                        "token-card",
                        token.isApproved ? "approved" : "pending"
                    );
                    card.innerHTML = `
                                <h4>${token.name}</h4>
                                <p><strong>Contact:</strong> ${token.number}</p>
                                <p><strong>TXID:</strong> ${
                                    token.transactionID
                                }</p>
                                <p><strong>+1:</strong> ${
                                    token.plusOne ? "Yes" : "No"
                                }</p>
                                <p><strong>+1 Name:</strong> ${
                                    token.plusOne ? token.plusOneName : "N/A"
                                }</p>
                                <p><strong>${
                                    token.isApproved ? "Paid" : "Due"
                                }:</strong> ৳${token.dueAmount}</p>
                                <p class="status ${
                                    token.isApproved
                                        ? "approved-status"
                                        : "pending-status"
                                }">Status: ${
                token.isApproved ? "Approved" : "Pending"
            }</p>
                                <div class="action-buttons">
                                    ${
                                        token.isApproved
                                            ? `<button class="revoke-btn" data-action="revoke">Revoke</button>`
                                            : `<button class="approve-btn" data-action="approve">Approve</button>
                                               <button class="delete-btn" data-action="delete">Delete</button>`
                                    }
                                </div>
                            `;
                    searchResultsContainer.appendChild(card);

                    const approveBtn = card.querySelector(".approve-btn");
                    const deleteBtn = card.querySelector(".delete-btn");
                    const revokeBtn = card.querySelector(".revoke-btn");

                    if (approveBtn)
                        approveBtn.addEventListener("click", () =>
                            approveToken(token.transactionID)
                        );
                    if (deleteBtn)
                        deleteBtn.addEventListener("click", () =>
                            deleteToken(token.transactionID)
                        );
                    if (revokeBtn)
                        revokeBtn.addEventListener("click", () =>
                            revokeToken(token.transactionID)
                        );
                });
            } else {
                searchEmptyState.style.display = "block";
            }
        } else {
            searchResultsSection.style.display = "none";
        }
    }

    async function approveToken(transactionID) {
        try {
            const response = await fetch(`/api/tokens/approve/${transactionID}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
            });
            const data = await response.json();
            if (response.ok) {
                alert("Token approved successfully!");
                fetchTokens();
                displaySearchResults();
            } else {
                alert(`Error: ${data.message}`);
                console.error("Approval failed:", data.error);
            }
        } catch (error) {
            alert("Network error. Could not approve token.");
            console.error("Network error:", error);
        }
    }

    async function revokeToken(transactionID) {
        try {
            const response = await fetch(`/api/tokens/revoke/${transactionID}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
            });
            const data = await response.json();
            if (response.ok) {
                alert("Token revoked successfully!");
                fetchTokens();
                displaySearchResults();
            } else {
                alert(`Error: ${data.message}`);
                console.error("Revocation failed:", data.error);
            }
        } catch (error) {
            alert("Network error. Could not revoke token.");
            console.error("Network error:", error);
        }
    }

    async function deleteToken(transactionID) {
        if (
            !confirm(
                "Are you sure you want to delete this token? This action cannot be undone."
            )
        ) {
            return;
        }
        try {
            const response = await fetch(`/api/tokens/${transactionID}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (response.ok) {
                alert("Token deleted successfully!");
                fetchTokens();
                displaySearchResults();
            } else {
                alert(`Error: ${data.message}`);
                console.error("Deletion failed:", data.error);
            }
        } catch (error) {
            alert("Network error. Could not delete token.");
            console.error("Network error:", error);
        }
    }

    searchBar.addEventListener("keyup", displaySearchResults);

    fetchTokens();
});