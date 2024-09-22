import React, { useState, useRef, useEffect } from 'react'
import { ReactReader, ReactReaderStyle } from 'react-reader'
import { FaBookmark, FaTrash, FaPalette } from 'react-icons/fa'

// ReactReader의 기본 스타일을 복사하고, 필요한 부분을 오버라이드한다.
const ownStyles = {
  ...ReactReaderStyle,
  arrow: {
    ...ReactReaderStyle.arrow,
    color: 'rgba(255, 255, 255, 0.7)',
  },
}

const HIGHLIGHT_COLORS = ['yellow', 'lightgreen', 'lightblue', 'pink']

const App = () => {
  // 상태 및 참조 변수 선언
  const [location, setLocation] = useState(null)                            // 현재 페이지 위치
  const [rendition, setRendition] = useState(null)                          // Epub 렌더링 객체로, 하이라이트를 추가하거나 제거할 때 사용
  const [page, setPage] = useState('')                                      // 현재 페이지 정보
  const [selections, setSelections] = useState([])                          // 하이라이트 목록
  const [showBookmarks, setShowBookmarks] = useState(false)                 // 하이라이트 목록을 보여줄지 여부
  const [currentColor, setCurrentColor] = useState(HIGHLIGHT_COLORS[0])     // 현재 선택된 하이라이트 색상
  const [sortOrder, setSortOrder] = useState('asc')                         // 하이라이트 목록 정렬 순서
  const tocRef = useRef(null)                                               // 목차 정보를 저장할 참조 변수
  const readerRef = useRef(null)                                            // ReactReader 컴포넌트의 참조 변수
  const [book, setBook] = useState(null)                                    // Epub 책 객체  

  // 페이지 정보 업데이트 함수
  const updatePageInfo = (epubcifi) => {
    if (book && book.locations && book.locations.length() > 0) {          // book 객체와 목차 정보가 있는지 확인
      const currentPage = book.locations.locationFromCfi(epubcifi) + 1    // 현재 페이지 번호
      const totalPages = book.locations.total                             // 전체 페이지 수
      setPage(`Page ${currentPage} of ${totalPages}`)
    }
  }

  // 사용자가 페이지를 이동할 때 호출되는 함수
  const locationChanged = (epubcifi) => {                                 // epubcifi: Epub.js의 CFI 객체로 EPUB 파일의 위치를 나타냄.
    setLocation(epubcifi)                                                 // 현재 페이지 위치를 업데이트
    updatePageInfo(epubcifi)                                              // 페이지 정보 업데이트
  }

  // 하이라이트 제거 함수
  const removeHighlight = (cfiRange) => {
    setSelections(prevSelections => prevSelections.filter(s => s.cfiRange !== cfiRange))  // 하이라이트 목록에서 제거
    if (rendition) {
      rendition.annotations.remove(cfiRange, 'highlight')                   // 하이라이트를 제거하는 메서드. cfiRange: 제거할 하이라이트의 위치 범위, 'highlight'는 하이라이트 타입
    }
  }

  // 북마크 창의 표시 여부를 토글하는 함수
  const toggleBookmarks = () => setShowBookmarks(!showBookmarks)

  // 하이라이트 색상 변경 함수
  const changeHighlightColor = (color) => {
    setCurrentColor(color)
  }

  // useEffect 훅을 사용하여 이벤트 핸들러를 등록 및 해제
  useEffect(() => {
    if (rendition) {
      const handleSelected = (cfiRange, contents) => {                      // 텍스트 선택 시 호출되는 함수
        const range = contents.range(cfiRange)                              // 선택한 텍스트의 범위
        const text = range.toString()                                       // 선택한 텍스트의 내용
        const existingSelection = selections.find(s => s.cfiRange === cfiRange) // 이미 선택한 텍스트인지 확인
        if (!existingSelection) {
          const newSelection = { cfiRange, text, color: currentColor }          // 새로운 하이라이트 정보 생성
          setSelections(prevSelections => [...prevSelections, newSelection])    // 하이라이트 목록에 추가
          rendition.annotations.highlight(cfiRange, {}, (e) => {                // 하이라이트 추가 메서드
            console.log('Annotation clicked', e)
          }, '', { fill: currentColor })

          // 선택 영역 해제
          const selection = contents.window.getSelection()                    // 선택된 텍스트 해제
          if (selection) {
            selection.removeAllRanges()
          }
        }
      }

      rendition.on('selected', handleSelected)                               // 하이라이트 선택 이벤트 리스너 등록

      // cleanup 함수에서 이벤트 핸들러 해제
      return () => {
        rendition.off('selected', handleSelected)                            // 이벤트 리스너 해제
      }
    }
  }, [rendition, currentColor, selections])                                 // rendition, currentColor, selections 변경 시 다시 실행

  // useEffect 훅을 사용하여 테마 설정
  useEffect(() => {
    if (rendition) {
      rendition.themes.default({
        '::selection': {
          'background': 'rgba(255,255,0, 0.3)'                              // 선택한 텍스트의 배경 색상 설정
        },
        'body': {
          'font-family': 'inherit !important',                              // 본문 글꼴 설정
          'font-size': 'inherit !important',
          'line-height': 'inherit !important'
        }
      })
      rendition.themes.select('default')                                    // 테마 선택
    }
  }, [rendition])                                                           // rendition 변경 시 다시 실행

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <div style={{ position: 'absolute', top: '17px', right: '20px', zIndex: 2, display: 'flex', alignItems: 'center' }}>
        <FaBookmark 
          onClick={toggleBookmarks}                                         // 북마크 창 토글
          style={{ cursor: 'pointer', fontSize: '20px' }} 
        />
      </div>
      {showBookmarks && (                                                    // 북마크 목록 표시 여부
        <div style={{ position: 'absolute', top: '40px', right: '20px', maxHeight: '300px', width: '250px', overflowY: 'auto', background: 'white', border: '1px solid #ccc', padding: '10px', zIndex: 2 }}>
          <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              {HIGHLIGHT_COLORS.map(color => (
                <FaPalette
                  key={color}
                  onClick={() => changeHighlightColor(color)}                // 하이라이트 색상 변경
                  style={{ cursor: 'pointer', marginRight: '5px', color: color }}
                />
              ))}
            </div>
          </div>
          {selections.map((selection, index) => (
            <div key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
              <FaBookmark style={{ marginRight: '5px', color: selection.color }} />
              <span 
                onClick={() => rendition.display(selection.cfiRange)}       // 해당 하이라이트로 이동
                style={{ cursor: 'pointer', flex: 1 }}
              >
                {selection.text.slice(0, 30)}...
              </span>
              <FaTrash 
                onClick={() => removeHighlight(selection.cfiRange)}         // 하이라이트 제거 버튼
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
        url="https://react-reader.metabits.no/files/alice.epub"               // Epub 파일 URL
        locationChanged={locationChanged}                                    // 페이지 위치 변경 핸들러
        getRendition={(rendition) => {                                       // 렌더링 객체 설정 핸들러
          setRendition(rendition)
        }}
        tocChanged={toc => {                                                 // 목차 변경 핸들러
          tocRef.current = toc
          if (readerRef.current) {
            readerRef.current.tocChanged = toc
          }
        }}
        epubInitOptions={{
          openAs: 'epub'
        }}
        getBook={(bookInstance) => {                                         // 책 객체 설정 핸들러
          setBook(bookInstance)
          bookInstance.locations.generate(1024).then(() => {                 // 책의 위치 정보를 생성 (2번 코드에서 추가된 부분)
            if (location) {
              updatePageInfo(location)                                       // 페이지 정보 업데이트
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
  )
}

export default App
