import React, { createContext, useContext, useEffect, useState } from 'react';
import SnackabraStore from './Snackabra.Store';
import { useLocalStore } from 'mobx-react';

const GlobalContext = createContext({});

const GlobalProvider = ({ children }) => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const init = async () =>{
      await store.sbStore.init();
      setReady(true)
    }
    init()
  }, [])
  /**
   * INCLUDE GLOBAL STORES HERE
   */
  const store = {
    sbStore: new SnackabraStore(),
  };
  return (
    <>
      {ready ?

        (<GlobalContext.Provider value={store}>
          {children}
        </GlobalContext.Provider>)

        : ''
      }
    </>
  );


};

const useStateValues = () => useContext(GlobalContext);

export { GlobalProvider, useStateValues };