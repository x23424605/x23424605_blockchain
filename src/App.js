import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import './App.css';
import CryptoNews from './News';


function App() {
  const CONTRACT_ADDRESS = "0xb41d118Da2fa4900ea8163424b957052A5e4f50f";

  const ABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "getItemsByOwner",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "itemCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "items",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        },
        {
          "internalType": "address payable",
          "name": "seller",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "isSold",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_price",
          "type": "uint256"
        }
      ],
      "name": "listItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "ownedItems",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "purchaseItem",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_to",
          "type": "address"
        }
      ],
      "name": "transferItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [items, setItems] = useState([]);
  const [ownedItems, setOwnedItems] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [listError, setListError] = useState("");
  const [itemNameError, setItemNameError] = useState(false);
  const [itemPriceError, setItemPriceError] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [transferAddresses, setTransferAddresses] = useState({});

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const account = accounts[0];
        setAccount(account);

        const tempProvider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(tempProvider);

        const tempSigner = tempProvider.getSigner();
        setSigner(tempSigner);

        const tempContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, tempSigner);
        setContract(tempContract);

        await loadItems(tempContract);
        await loadOwnedItems(tempContract, account);
      } catch (error) {
        console.error("User rejected the request:", error);
      }
    } else {
      alert("MetaMask is not installed. Please install it to use this app.");
    }
  };

  const logoutWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setItems([]);
    setOwnedItems([]);
    setErrorMessage("");
    setListError("");
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          connectWallet();
        } else {
          logoutWallet();
        }
      });
    }
  }, []);

  const loadItems = async (contract) => {
    const itemCount = await contract.itemCount();
    let items = [];
    for (let i = 1; i <= itemCount; i++) {
      const item = await contract.items(i);
      items.push(item);
    }
    setItems(items);
  };

  const loadOwnedItems = async (contract, owner) => {
    const ownedItemIds = await contract.getItemsByOwner(owner);
    let ownedItems = [];
    for (let i = 0; i < ownedItemIds.length; i++) {
      const item = await contract.items(ownedItemIds[i]);
      ownedItems.push(item);
    }
    setOwnedItems(ownedItems);
  };

  const listItem = async (name, price) => {
    try {
      setListError("");
      setItemNameError(false);
      setItemPriceError(false);

      if (!name.trim()) {
        setItemNameError(true);
        return;
      }

      if (!price.trim() || isNaN(price) || parseFloat(price) <= 0) {
        setItemPriceError(true);
        return;
      }

      const tx = await contract.listItem(name, ethers.utils.parseEther(price));
      await tx.wait();
      await loadItems(contract);
      document.getElementById("itemName").value = "";
      document.getElementById("itemPrice").value = "";
    } catch (error) {
      if (error.code === 4001 || error.message.includes("user rejected transaction")) {
        setListError("Transaction was cancelled.");
      } else {
        setListError("Failed to list item. Check if inputs are valid.");
      }
      console.error(error);
    }
  };
  const handleTransferAddressChange = (itemId, value) => {
    setTransferAddresses(prevState => ({
      ...prevState,
      [itemId]: value
    }));
  };
  
  const purchaseItem = async (id, price) => {
    try {
      setErrorMessage("");
      const tx = await contract.purchaseItem(id, { value: ethers.utils.parseEther(price) });
      await tx.wait();
      await loadItems(contract);
      await loadOwnedItems(contract, account);
    } catch (error) {
      if (error.code === 4001 || error.message.includes("user rejected transaction")) {
        setErrorMessage("Transaction was cancelled.");
      } else if (error?.reason?.includes("Seller cannot buy their own item") ||
                 error?.data?.message?.includes("Seller cannot buy their own item") ||
                 error?.message?.includes("Seller cannot buy their own item")) {
        setErrorMessage("Seller cannot buy their own item");
      } else {
        setErrorMessage("Transaction failed: ");
      }
      console.error(error);
    }
  };

  const transferItem = async (id, toAddress) => {
    try {
      const CONTRACT_ADDRESS = "0x0c88Ee051F0d44C9de31968843bA25CcA75e0176";
      const ABI = [
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_id",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "_to",
              "type": "address"
            }
          ],
          "name": "transferItem",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_owner",
              "type": "address"
            }
          ],
          "name": "getItemsByOwner",
          "outputs": [
            {
              "internalType": "uint256[]",
              "name": "",
              "type": "uint256[]"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "itemCount",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "name": "items",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "price",
              "type": "uint256"
            },
            {
              "internalType": "address payable",
              "name": "seller",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "owner",
              "type": "address"
            },
            {
              "internalType": "bool",
              "name": "isSold",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "name": "ownedItems",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ];

      setErrorMessage("");
      const tempProvider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(tempProvider);

        const tempSigner = tempProvider.getSigner();
        setSigner(tempSigner);

        const tempContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, tempSigner);
        setContract(tempContract);
      const tx = await contract.transferItem(id, toAddress);
      await tx.wait();
      await loadItems(contract);
      await loadOwnedItems(contract, account);
      setTransferAddresses("");
    } catch (error) {
      if (error.code === 4001 || error.message.includes("user rejected transaction")) {
        setErrorMessage("Transaction was cancelled.");
      } else {
        setErrorMessage("Failed to transfer item: Enter the address to Transfer");
      }
      console.error(error);
    }
  };

  return (
    <div className="App">
      <div className="header">
        <h1>Hub Market</h1>
        {account && (
          <button className="logout-button" onClick={logoutWallet}>
            Logout
          </button>
        )}
      </div>

      {!account ? (
        <button className="button" onClick={connectWallet}>
          Connect to MetaMask
        </button>
      ) : (
        <p><strong>Connected Account:</strong> {account}</p>
      )}

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      {listError && (
        <div className="listError">
          {listError}
        </div>
      )}

      {account && (
        <>
          <div className="tabs">
            <button onClick={() => setActiveTab('list')} className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}>
              List Products
            </button>
            <button onClick={() => setActiveTab('owned')} className={`tab-button ${activeTab === 'owned' ? 'active' : ''}`}>
              Owned Products
            </button>
          </div>

          <div className="main-content">
            {activeTab === 'list' && (
              <div className="list-item">
                <h2>Items Marketed</h2>
                <div>
                  <input 
                    id="itemName" 
                    type="text" 
                    placeholder="Enter item name" 
                    className={`input-field ${itemNameError ? 'error' : ''}`} 
                  />
                  {itemNameError && <span className="error-message">Item name cannot be empty.</span>}
                  
                  <input 
                    id="itemPrice" 
                    type="text" 
                    placeholder="Enter item price in ETH" 
                    className={`input-field ${itemPriceError ? 'error' : ''}`} 
                  />
                  {itemPriceError && <span className="error-message">Price must be a valid number greater than 0.</span>}

                  <button 
                    onClick={() => {
                      const name = document.getElementById("itemName").value;
                      const price = document.getElementById("itemPrice").value;
                      listItem(name, price);
                    }} 
                    className="button"
                  >
                    Add Product
                  </button>
                </div>

                {items.length === 0 && <p>No items available for sale</p>}
                {items.map((item) => (
                  <div key={item.id} className="item-card">
                    <p><strong>Name:</strong> {item.name}</p>
                    <p><strong>Price:</strong> {ethers.utils.formatEther(item.price)} ETH</p>
                    <button onClick={() => purchaseItem(item.id, ethers.utils.formatEther(item.price))} className="button">Buy</button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'owned' && (
              <div className="owned-items">
                <h2>Your Owned Items</h2>
                {ownedItems.length === 0 && <p>No owned items</p>}
                {ownedItems.map((item) => (
  <div key={item.id} className="item-card">
    <p><strong>Name:</strong> {item.name}</p>
    <p><strong>Price:</strong> {ethers.utils.formatEther(item.price)} ETH</p>
    <input
      type="text"
      placeholder="Enter address to transfer"
      value={transferAddresses[item.id] || ""}  
      onChange={(e) => handleTransferAddressChange(item.id, e.target.value)}  
            className="transfer-input"
    />
    <p><strong>Owner:</strong> {item.owner.slice(0, 6)}...{item.owner.slice(-4)}</p>

    <button 
 onClick={() => transferItem(item.id, transferAddresses[item.id] || "")} 
       className="button"
    >
      Transfer Item
    </button>
  </div>
))}

              </div>
            )}
          </div>
        </>
      )}
                  <CryptoNews />

    </div>
  );
}

export default App;
