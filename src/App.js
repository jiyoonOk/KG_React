import React, { useState, useRef, useEffect } from 'react'
import { ReactReader, ReactReaderStyle } from 'react-reader'
import { FaBookmark, FaTrash, FaPalette } from 'react-icons/fa'
import { fetchData } from './neo4jService';
import GraphViewer from './components/GraphViewer.js';
import Chatbot from "react-chatbot-kit";
import setting from "./components/chatbot/setting.js";
import MessageParser from "./components/chatbot/MessageParser.js";
import ActionProvider from "./components/chatbot/ActionProvider.js";

import "react-chatbot-kit/build/main.css";
import "./styles/chatbot.css";
import "remixicon/fonts/remixicon.css";

const ownStyles = {
  ...ReactReaderStyle,
  arrow: {
    ...ReactReaderStyle.arrow,
    color: 'rgba(255, 255, 255, 0.7)',
  },
}

const HIGHLIGHT_COLORS = ['yellow', 'lightgreen', 'lightblue', 'pink']

const App = () => {
  const [location, setLocation] = useState(null)
  const [rendition, setRendition] = useState(null)
  const [page, setPage] = useState('')
  const [selections, setSelections] = useState([])
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [currentColor, setCurrentColor] = useState(HIGHLIGHT_COLORS[0])
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const tocRef = useRef(null)
  const readerRef = useRef(null)
  const [book, setBook] = useState(null)

  const updatePageInfo = (epubcifi) => {
    if (book && book.locations && book.locations.length() > 0) {
      const currentPage = book.locations.locationFromCfi(epubcifi) + 1
      const totalPages = book.locations.total
      setPage(`Page ${currentPage} of ${totalPages}`)
    }
  }

  const locationChanged = (epubcifi) => {
    setLocation(epubcifi)
    updatePageInfo(epubcifi)
  }

  const removeHighlight = (cfiRange) => {
    setSelections(prevSelections => prevSelections.filter(s => s.cfiRange !== cfiRange))
    if (rendition) {
      rendition.annotations.remove(cfiRange, 'highlight')
    }
  }

  const toggleBookmarks = () => setShowBookmarks(!showBookmarks)

  const changeHighlightColor = (color) => {
    setCurrentColor(color)
  }

  useEffect(() => {
    if (rendition) {
      const handleSelected = (cfiRange, contents) => {
        const range = contents.range(cfiRange)
        const text = range.toString()
        const existingSelection = selections.find(s => s.cfiRange === cfiRange)
        if (!existingSelection) {
          const newSelection = { cfiRange, text, color: currentColor }
          setSelections(prevSelections => [...prevSelections, newSelection])
          rendition.annotations.highlight(cfiRange, {}, (e) => {
            console.log('Annotation clicked', e)
          }, '', { fill: currentColor })

          const selection = contents.window.getSelection()
          if (selection) {
            selection.removeAllRanges()
          }
        }
      }

      rendition.on('selected', handleSelected)

      return () => {
        rendition.off('selected', handleSelected)
      }
    }
  }, [rendition, currentColor, selections])

  useEffect(() => {
    if (rendition) {
      rendition.themes.default({
        '::selection': {
          'background': 'rgba(255,255,0, 0.3)'
        },
        'body': {
          'font-family': 'inherit !important',
          'font-size': 'inherit !important',
          'line-height': 'inherit !important'
        }
      })
      rendition.themes.select('default')
    }

    async function getData() {
      const data = await fetchData();
      if (data) {
        setNodes(data.nodes || []);
        setLinks(data.links || []);
      }
    }
    getData();
  }, [rendition])

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 왼쪽: EPUB Reader */}
      <div style={{ flex: '0 0 50%', position: 'relative', height: '100%', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '17px', right: '20px', zIndex: 2, display: 'flex', alignItems: 'center' }}>
          <FaBookmark 
            onClick={toggleBookmarks}
            style={{ cursor: 'pointer', fontSize: '20px' }} 
          />
        </div>
        {showBookmarks && (
          <div style={{ position: 'absolute', top: '40px', right: '20px', maxHeight: '300px', width: '250px', overflowY: 'auto', background: 'white', border: '1px solid #ccc', padding: '10px', zIndex: 2 }}>
            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                {HIGHLIGHT_COLORS.map(color => (
                  <FaPalette
                    key={color}
                    onClick={() => changeHighlightColor(color)}
                    style={{ cursor: 'pointer', marginRight: '5px', color: color }}
                  />
                ))}
              </div>
            </div>
            {selections.map((selection, index) => (
              <div key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                <FaBookmark style={{ marginRight: '5px', color: selection.color }} />
                <span 
                  onClick={() => rendition.display(selection.cfiRange)}
                  style={{ cursor: 'pointer', flex: 1 }}
                >
                  {selection.text.slice(0, 30)}...
                </span>
                <FaTrash 
                  onClick={() => removeHighlight(selection.cfiRange)}
                  style={{ cursor: 'pointer', marginLeft: '5px' }}
                />
              </div>
            ))}
          </div>
        )}
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 2 }}>
          {page}                                                               
        </div>
        <ReactReader
          url="https://react-reader.metabits.no/files/alice.epub"
          locationChanged={locationChanged}
          getRendition={(rendition) => {
            setRendition(rendition)
          }}
          tocChanged={toc => {
            tocRef.current = toc
            if (readerRef.current) {
              readerRef.current.tocChanged = toc
            }
          }}
          epubInitOptions={{
            openAs: 'epub'
          }}
          getBook={(bookInstance) => {
            setBook(bookInstance)
            bookInstance.locations.generate(1024).then(() => {
              if (location) {
                updatePageInfo(location)
              }
            })
          }}
          location={location}
          epubOptions={{
            flow: 'paginated',
            width: '100%',
            height: '100%',
            spread: 'always'
          }}
          styles={ownStyles}
          ref={readerRef}
        />
      </div>

      {/* 오른쪽: Knowledge Graph */}
      <div style={{ flex: '0 0 50%', position: 'relative', height: '100%', overflow: 'hidden' }}>
        <GraphViewer nodes={nodes} links={links} />
      </div>

      {/* 최상단에 챗봇 */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
        <Chatbot
          config={setting}
          messageParser={MessageParser}
          actionProvider={ActionProvider} 
        />
      </div>
    </div>
  )
}

export default App
