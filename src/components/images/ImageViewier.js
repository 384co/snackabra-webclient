import * as React from 'react';
import NotificationContext from "../../contexts/NotificationContext";
import { Image } from 'mui-image'
import { createUseGesture, dragAction, pinchAction } from '@use-gesture/react'
import { a, useSpring, config } from '@react-spring/web'

const useGesture = createUseGesture([dragAction, pinchAction])

export default function ImageViewer(props) {
    const { loadImage, image, controlMessages, sbContext, onClose, inhibitSwipe } = props
    const notify = React.useContext(NotificationContext)
    const [img, setImage] = React.useState('');
    const [imgLoaded, setImageLoaded] = React.useState(false);
    const [closing, setClosing] = React.useState(false);
    const myRef = React.createRef();

    let [{ x, y, scale, rotateZ }, api] = useSpring(() => ({
        x: 0,
        y: 0,
        scale: 1,
        rotateZ: 0,
    }))

    React.useEffect(() => {
        console.log(image, controlMessages)
        setImage(image.image)
        if (loadImage) {
            sbContext.SB.storage.retrieveImage(image.imageMetaData, controlMessages).then((data) => {
                console.log(data)
                if (data.hasOwnProperty('error')) {
                    console.error(data['error'])
                    notify.warn('Could not load full size image')
                } else {
                    setImage(data['url'])
                    setImageLoaded(true)
                }
            }).catch((error) => {
                console.error('openPreview() exception: ' + error.message);
                notify.warn('Could not load full size image')
            })
        }


    }, [image, controlMessages, sbContext, loadImage, notify, onClose])


    React.useEffect(() => {
        const handler = (e) => e.preventDefault()
        document.addEventListener('gesturestart', handler)
        document.addEventListener('gesturechange', handler)
        document.addEventListener('gestureend', handler)
        return () => {
            document.removeEventListener('gesturestart', handler)
            document.removeEventListener('gesturechange', handler)
            document.removeEventListener('gestureend', handler)
        }
    }, [])

    let height = window.innerHeight - (window.innerHeight / 4)

    React.useEffect(() => {
        open({ canceled: true })
        if (props.img !== img) {
            setImage(props.img)
            setClosing(false)
        }
    }, [props.img])

    React.useEffect(() => {
        setImageLoaded(props.imgLoaded)
    }, [props.imgLoaded])



    const open = ({ canceled }) => {
        if (canceled)
            api.start({ y: 0, x: 0, scale: 1, rotateZ: 0, pinching: false, reset: true, immediate: true, config: canceled ? config.wobbly : config.stiff })
    }

    const close = () => {
        api.start({ y: 0, x: 0, scale: 1, rotateZ: 0, reset: true, immediate: true, config: { ...config.stiff, velocity: 0 } })
        setTimeout(() => {
            props.onClose()
        }, 50)

    }

    useGesture(
        {
            onDrag: (state) => {
                const { down, pinching, dragging, offset: [x, y], last, velocity: [vy], movement: [mx] } = state
                // if the user drags up passed a threshold, then we cancel
                // the drag so that the sheet resets to its open position
                console.log(state)
                if (down && !dragging && pinching) {
                    return;
                }
                const s = scale.animation.to;
                if (last && s === 1) {
                    if (Math.abs(y) > height * 0.6) {

                        api.start({
                            y: Math.sign(mx) < 0 ? window.innerHeight : -Math.abs(window.innerHeight), x: 0
                        })
                        setTimeout(() => {
                            setClosing(true)
                        }, 25)
                        setTimeout(() => {
                            close(vy)
                        }, 75)
                    } else {
                        open({ canceled: true })
                    }
                } else {
                    if (s <= 1) {
                        api.start({
                            y: y, x: 0, immediate: false
                        })

                    } else {
                        const width = Number((window.innerWidth * s) / 2).toFixed(0);
                        const xLimit = Math.abs(x) + (window.innerWidth / 2) >= width;
                        if (xLimit) return
                        api.start({
                            y: y,
                            x: x,
                            immediate: true
                        })
                    }

                }
            },
            onPinch: (state) => {
                inhibitSwipe(1)
                let { offset: [s], direction: [d] } = state;
                if (s < 1) s = 1
                if (Math.sign(d) < 0) {
                    api.start({ scale: s, y: 0, x: 0, rubberband: false, immediate: false, duration: 1000 })
                } else {
                    api.start({ scale: s, immediate: true })
                }

                if (s === 1) {
                    setTimeout(() => {
                        inhibitSwipe(0)
                    }, 200)

                    api.start({ scale: 1, y: 0, x: 0, rubberband: false, immediate: true })
                }
            },
        },
        {
            target: myRef,
            drag: { from: () => [x.get(), y.get()], filterTaps: true, rubberband: false, immediate: true },
            pinch: { scaleBounds: { min: 1, max: 20 }, pinchOnWheel: true, rubberband: false, immediate: true },
        }
    )
    return (
        <a.div id={'gesture-container'} ref={myRef} style={{ touchAction: 'none', display: 'block', x, y, scale, rotateZ, overflow: 'none' }} >
            {img && <Image
                style={{
                    display: closing ? 'none' : 'inherit'
                }}
                src={img}
                width="100%"
                fit="contain"
                duration={imgLoaded ? 0 : 1000}
                easing="cubic-bezier(0.7, 0, 0.6, 1)"
                showLoading={true}
                errorIcon={true}
                shift={null}
                distance="100px "
                shiftDuration={imgLoaded ? 0 : 1000}
                bgColor="inherit"
            />
            }

        </a.div>
    );
}
