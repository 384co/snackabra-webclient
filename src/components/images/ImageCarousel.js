import * as React from 'react';
import Grid from '@mui/material/Grid';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import IconButton from '@mui/material/IconButton';
import Stop from '@mui/icons-material/Stop';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SwipeableViews from 'react-swipeable-views';
import { useTheme } from '@mui/material/styles';
import ImageViewer from './ImageViewier';
import Slide from '@mui/material/Slide';
import Paper from '@mui/material/Paper';
import { autoPlay, virtualize, bindKeyboard } from 'react-swipeable-views-utils';

const EnhancedSwipeableViews = bindKeyboard(autoPlay(SwipeableViews));

export default function ImageCarousel(props) {
    let mouseMoveTimeout;
    const { img, images, sbContext, controlMessages } = props
    const [imageList, setImageList] = React.useState(images);
    const [autoplay, setAutoplay] = React.useState(false);
    const [showControls, setShowControls] = React.useState(false);
    const theme = useTheme();
    const [value, setValue] = React.useState(null);
    const [swipeInhibiter, inhibitSwipe] = React.useState(0);

    const containerRef = React.useRef(null);

    const handleChangeIndex = (index) => {
        console.log(index)
        if (index < 0) index = imageList.length - 1
        setValue(index);
    };

    React.useEffect(() => {
        const _images = images
        for (let i in _images) {
            if (_images[i]._id === img._id) {
                handleChangeIndex(Number(i))
                break;
            }
        }

    }, [images])

    const slideRenderer = ({ key, index }) => {
        return (<ImageViewer
            key={key}
            image={imageList[index]}
            sbContext={sbContext}
            controlMessages={controlMessages}
            inhibitSwipe={inhibitSwipe}
            onOpen={() => {
                props.onOpen()
            }}
            onClose={() => {
                props.onClose()
            }} />
        );
    }

    const toggleShowControls = (visibility) => {

        typeof visibility === "boolean" ? setShowControls(visibility) : setShowControls(!showControls)
    }


    const toggleAutoplay = (e) => {
        e.preventDefault()
        setAutoplay(!autoplay)
    }

    const showMediaControls = () => {
        if (!!swipeInhibiter) return
        toggleShowControls(true)
        if (mouseMoveTimeout) clearTimeout(mouseMoveTimeout)
        mouseMoveTimeout = setTimeout(() => {
            toggleShowControls(false)
        }, 5000)
    }
    console.log(!!!swipeInhibiter)
    return (
        <>
            <EnhancedSwipeableViews
                on={toggleShowControls}
                onMouseMove={showMediaControls}
                // onMouseLeave={() => { toggleShowControls(false) }}
                id={'image-carousel'}
                axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                index={value}
                disableLazyLoading
                resistance
                autoplay={autoplay && !!!swipeInhibiter}
                onChangeIndex={handleChangeIndex}
                style={{ padding: 0, height: '100%' }}
                disabled={!!swipeInhibiter}
            >
                {imageList.map((key, index) => {
                    return (<ImageViewer
                        key={key}
                        image={imageList[index]}
                        sbContext={sbContext}
                        controlMessages={controlMessages}
                        inhibitSwipe={inhibitSwipe}
                        onOpen={() => {
                            props.onOpen()
                        }}
                        onClose={() => {
                            props.onClose()
                        }} />
                    );
                })

                }

            </EnhancedSwipeableViews>
            <Grid
                container
                direction="row"
                justifyContent="center"
                alignItems="center"
                style={{
                    position: "fixed",
                    bottom: 0,
                    marginBottom: 8
                }}
                onMouseMove={() => {
                    mouseMoveTimeout = null
                    toggleShowControls(true)
                }}
                ref={containerRef}
            >
                <Slide direction="up" in={showControls} container={containerRef.current}>
                    <Paper sx={{ bgcolor: 'rgb(18, 18, 18, 0.7)' }} elevation={4} onMouseMove={() => {
                        mouseMoveTimeout = null
                        toggleShowControls(true)
                    }}>
                        <Grid
                            container
                            direction="row"
                            justifyContent="center"
                            alignItems="center"
                            sx={{ width: 150 }}
                        >
                            <IconButton
                                onClick={() => {
                                    handleChangeIndex((value + 1) % imageList.length)
                                }}
                                aria-label="prev-image"
                                sx={{ color: 'white' }}
                            >
                                <SkipPreviousIcon />
                            </IconButton>
                            <IconButton
                                onClick={(e) => {
                                    toggleAutoplay(e)
                                }}
                                aria-label="play-stop"
                                sx={{ color: 'white' }}
                            >
                                {!autoplay ?
                                    <PlayArrowIcon sx={{ height: 38, width: 38 }} /> :
                                    <Stop sx={{ height: 38, width: 38 }} />

                                }

                            </IconButton>
                            <IconButton
                                sx={{ color: 'white' }}
                                onClick={() => {
                                    handleChangeIndex(value - 1)
                                }}
                                aria-label="next-image"
                            >
                                <SkipNextIcon />
                            </IconButton>
                        </Grid>
                    </Paper>
                </Slide>
            </Grid>
        </>
    );
}
