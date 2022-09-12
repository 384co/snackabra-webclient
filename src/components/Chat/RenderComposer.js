import * as React from 'react';

// style="--placeholderTextColor:#b2b2b2; height: 34px; outline-width: 0px; outline-color: transparent; outline-offset: 0px;"

function RenderComposer(props) {
  const [text, setText] = React.useState('')
  const [filesAttached, setFilesAttached] = React.useState(props.filesAttached)

  React.useEffect(() => {
    const sendButton = document.getElementById('send-button');
    sendButton.addEventListener('click', handleSend)
  }, [])

  const handleSend = () => {
    setTimeout(()=>{
      setText('')
      props.onTextChanged('')
    },250)
  }

  React.useEffect(() => {
    setFilesAttached(props.filesAttached)
    if (props.filesAttached) {
      setText('')
      props.onTextChanged('')
    }
  }, [props.filesAttached])

  const checkForSend = (e) => {
    if (e.keyCode === 13 && !e.ctrlKey && !e.shiftKey) {
      document.getElementById('send-button').click()
      handleSend();
    }
  }

  const handlChange = (e) => {
    setText(e.target.value)
    props.onTextChanged(e.target.value)
  }

  return (
    <textarea placeholder="Type a message..." autoCapitalize="sentences" autoComplete="on" autoCorrect="on" dir="auto"
              value={text}
              rows="1" spellCheck="true" aria-label="Type a message..."
              className="css-textinput-11aywtz r-placeholderTextColor-6taxm2 r-flex-13awgt0 r-fontSize-ubezar r-lineHeight-1cwl3u0 r-marginBottom-15zivkp r-marginLeft-1n0xq6e r-marginTop-kc8jnq r-paddingLeft-m2pi6t r-paddingTop-13gvty3"
              data-testid="Type a message..."
              onKeyUp={checkForSend}
              onChange={handlChange}
              readOnly={filesAttached}
              style={{
                '--placeholderTextColor': '#b2b2b2',
                height: '34px',
                outlineWidth: '0px',
                outlineColor: 'transparent',
                outlineOffset: '0px'
              }}
    />
  )
}

export default RenderComposer;
