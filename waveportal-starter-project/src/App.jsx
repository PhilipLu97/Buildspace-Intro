import React, { useEffect, useState } from "react"
import { ethers } from "ethers"
import abi from "./utils/WavePortal.json"

//cosmetic imports
import './App.css'
import Swal from 'sweetalert2/dist/sweetalert2.all.js'
import withReactContent from 'sweetalert2-react-content'
// import SimplexNoise from 'simplex-noise';
// import Particles from "react-tsparticles"


const App = () => {

  const contractAddress = "0x4d5054B5D5005F2AC24Faa22D0351Bd615fcAa2F";
  const contractABI = abi.abi;

  //State variable we use to store our user's public wallet.
  const [currentAccount, setCurrentAccount] = useState("");
  //State variable tracking the total number of waves on the contract.
  const [numOfWaves, setNumOfWaves] = useState(0);
  //State variable tracking all the waves on the contract.
  const [allWaves, setAllWaves] = useState([]);
  //State variable tracking user message
  const [tweetValue, setTweetValue] = useState("");

  const MySwal = withReactContent(Swal)

  const checkIfWalletIsConnected = async () => {
    try {
      // First make sure we have access to window.ethereum
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      // Check if we're authorized to access the user's wallet
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        getAllWaves()
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        MySwal.fire({
          icon: "error",
          title: "Get MetaMask!",
          text: "Download from metamask.io",
          confirmButtonText: "On my way"
        })
        return;
      }

      const accounts = ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      
    } catch (error) {
      console.log(error)
    }
  }

/* initialize the total number of waves on page load */
  const initTotalWaves = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, provider);
        console.log("Initializing total wave count . . .");
        const waveCount = await wavePortalContract.getTotalWaves()
        console.log("Total waves: ", waveCount.toNumber())
        setNumOfWaves(waveCount.toNumber())
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const getAllWaves = async () => {
    const { ethereum } = window;
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        const waves = await wavePortalContract.getAllWaves();

        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            message: wave.message,
            timestamp: new Date(wave.timestamp * 1000),
            prizeWon: ethers.utils.formatEther(wave.prizeWon.toString())
          };
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      console.log(tweetValue)

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        // count the # of waves on the contract
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        //get the array of waves on the contract
        let waves = await getAllWaves()
        console.log("Retrieved all waves...");

        /* message implementation using sweetalert2
        const { value: msg } = await MySwal.fire({
          title: 'Submit a message',
          input: 'text',
          inputValue: "Sick page yo",
          inputAttributes: {
            autocapitalize: 'off'
          },
          showCancelButton: true,
          confirmButtonText: 'Send',
          inputValidator: (value) => {
            if (!value) {
              return 'Come on, write something!'
            }
          }
        }) || "Sick page yo"
        
        console.log({msg}.msg)

        */ 

        const waveTxn = await wavePortalContract.wave(tweetValue, {gasLimit: 300000});
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait()
        .then(async function (success) {
          await MySwal.fire({
            icon: 'success',
            title: 'Thanks for the W 💯',
            showConfirmButton: false,
            timer: 1500
          });
        }, async function (failure) {
          let balance = await provider.getBalance(contractAddress)
          balance = ethers.utils.formatEther(balance)
          console.log(balance)
          if (balance < 0.0001) { //< 0.0001 ether
            MySwal.fire({
            icon: 'error',
            title: 'Contract lacks ether D:',
            showConfirmButton: false,
            timer: 3000
            })
            throw("Contract lacks funds");
          } else {
            MySwal.fire({
            icon: 'error',
            title: 'Wait at least 30 seconds after your last wave',
            showConfirmButton: false,
            timer: 3000
            });
            throw("Cooldown in effect");
          }
          
        });
        console.log("Mined -- ", waveTxn.hash);

        //update wave counter and the waves 
        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setNumOfWaves(count.toNumber());

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  //This runs our function when the page loads.
  useEffect(() => {
    checkIfWalletIsConnected()
    initTotalWaves()
    getAllWaves()

    let wavePortalContract;

    const onNewWave = async (from, message, timestamp, prizeWon) => {
      console.log('New wave', from, message, timestamp);
      await setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          message: message,
          timestamp: new Date(timestamp * 1000),
          prizeWon: ethers.utils.formatEther(prizeWon.toString())
        }
      ]);

      if (ethers.utils.formatEther(prizeWon.toString()) > 0) {
        await MySwal.fire({
        icon: "success",
        title: "You won a prize!",
        text: "Enjoy the " + ethers.utils.formatEther(prizeWon) + " ETH ;D",
        showConfirmButton: false,
        timer: 3000
      });
      } 
    };

  /*
    const onPrizeWon =  async (winner, amount, timestamp) => {
      console.log('Congratulations! ', winner, ' won ', amount, ' ether!', timestamp);
      await MySwal.fire({
        icon: "success",
        title: "You won a prize!",
        text: "Enjoy the " + ethers.utils.formatEther(amount) + " ETH ;D",
        showConfirmButton: false,
        timer: 3000
      });
    };
    */

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on('NewWave', onNewWave);
      //wavePortalContract.on('PrizeWon', onPrizeWon);
    }

    return () => {
      if(wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
        //wavePortalContract.off('PrizeWon', onPrizeWon);
      }
    };
  }, []);

  return (
    
    <div className="mainContainer">
      <div className="dataContainer">
    
        <div className="header">
          <span class= "wave">👋 </span>
          <a href="https://twitter.com/_alltold?ref_src=twsrc%5Etfw" class="twitter-follow-button" data-show-count="false">Follow @_alltold</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script> I'm new to Twitter and I hate it oh pleeeeease don't add me ;) 
        </div>

        <div className="bio">
          Sup guys, my name's Phil, and I'm a University of Waterloo student looking to take part in building the next generation of the internet. anyway pls hire me pls hire me pls hire me :)
        </div>

        <div className="waveCounter">
          {'🔥 Total number of dubs: ' + numOfWaves + ' 🔥'}
        </div>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

      {
      // If there is no currentAccount, render this button
      }
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        <br />

        {
          currentAccount ? (<textarea name="tweetArea"
            placeholder="Send a message!"
            type="text"
            id="tweet"
            value={tweetValue}
            onChange={e => setTweetValue(e.target.value)} ></textarea> ) : null
        }

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ fontFamily: "Monaco", backgroundColor: "OldLace", marginTop: "16px", padding: "8px", borderRadius: "15px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
              <div>Prize Won: {wave.prizeWon + " ETH"}</div>
            </div>)
        })}
      </div>
    </div>
  );
}

export default App
