'use strict'

import React from 'react'
import Editor from 'tui-editor'

import Component from '../components/Component'

import 'codemirror/lib/codemirror.css'
import 'tui-editor/dist/tui-editor.min.css'
import 'tui-editor/dist/tui-editor-contents.min.css'

import LektorLinkExtension from './tuiEditorLektorLinkExt.jsx'
import LektorImageExtension from './tuiEditorLektorImageExt.jsx'

const toolbarItems = [
  'heading',
  'bold',
  'italic',
  'strike',
  'divider',
  'hr',
  'quote',
  'divider',
  'ul',
  'ol',
  // 'task',
  'indent',
  'outdent',
  'divider',
  'table',
  // 'image',
  // 'link',
  'divider',
  'code',
  'codeblock'
]

class ToastEditor extends Component {
  constructor (props) {
    super(props)

    this.element = null
    this.content = this.props.value

    this.onChange = this.onChange.bind(this)
    this.onLoad = this.onLoad.bind(this)
    this.onRef = this.onRef.bind(this)
    this.blur = this.blur.bind(this)
    this.focus = this.focus.bind(this)

    this.state = {
      style: {},
      editor: null
    }
  }

  onLoad (editor) {
    // add in the mode switcher
    const toolbar = editor.getUI().getToolbar()
    toolbar.insertItem(0, { type: 'button', options: { name: 'richtext-tab', text: 'Rich Text', event: 'mode-tab-richtext', tooltip: 'Use Rich Text Editor', className: 'mode-tab' } })
    toolbar.insertItem(1, { type: 'button', options: { name: 'markdown-tab', text: 'Markdown', event: 'mode-tab-markdown', tooltip: 'Use Markdown Editor', className: 'mode-tab' } })
    toolbar.insertItem(2, { type: 'divider', options: { name: 'switch-divider', className: 'mode-tab-divider' } })
    const richtextbtn = toolbar.getItem(0).$el
    const markdownbtn = toolbar.getItem(1).$el
    editor.eventManager.addEventType('mode-tab-richtext')
    editor.eventManager.addEventType('mode-tab-markdown')
    editor.eventManager.listen('mode-tab-richtext', () => { markdownbtn.removeClass('active'); richtextbtn.addClass('active'); editor.changeMode('wysiwyg', true) })
    editor.eventManager.listen('mode-tab-markdown', () => { richtextbtn.removeClass('active'); markdownbtn.addClass('active'); editor.changeMode('markdown', true) })
    const activebtn = (this.props.type.default_view === 'richtext') ? richtextbtn : markdownbtn
    activebtn.addClass('active')

    this.recalculateHeight(editor)
  }

  onImageUpload (file, cb, source) {
    // do image upload of file here, call cb once done
    cb(file.name) // leave second param null to use user-specified text
  }

  recalculateHeight (editor) {
    const currentEditor = editor.getCurrentModeEditor()
    let editorHeight
    try {
      // markdown
      const editorEl = currentEditor.editorContainerEl.getElementsByClassName('CodeMirror-sizer')[0]
      editorHeight = $(editorEl).outerHeight(true)
    } catch (e) {
      // wysiwyg

      // get height of all children in editor
      const editorEl = currentEditor.$editorContainerEl[0].firstChild
      let editorChildren = Array.from(editorEl.children)
      const editorChildrenHeights = editorChildren.map(el => $(el).outerHeight(true))
      editorHeight = editorChildrenHeights.reduce((a, b) => a + b)

      // add on padding/border/margin of editor element
      const marginTop = parseInt(window.getComputedStyle(editorEl).marginTop)
      const marginBottom = parseInt(window.getComputedStyle(editorEl).marginBottom)
      const paddingTop = parseInt(window.getComputedStyle(editorEl).paddingTop)
      const paddingBottom = parseInt(window.getComputedStyle(editorEl).paddingBottom)
      const borderTop = parseInt(window.getComputedStyle(editorEl).borderTopWidth)
      const borderBottom = parseInt(window.getComputedStyle(editorEl).borderBottomWidth)
      editorHeight += (marginTop + marginBottom + paddingTop + paddingBottom + borderTop + borderBottom)
    }

    const totalHeight = editorHeight + 31 + 31
    const totalHeightStr = totalHeight + 'px'
    editor.height(totalHeightStr)
  }

  onChange () {
    if (!this.state.editor) {
      return
    }

    const markdown = this.state.editor.getMarkdown()

    // recalculate height - delay is required to get most up to date height
    setTimeout(function () {
      this.recalculateHeight(this.state.editor)
    }.bind(this), 10)

    // send markdown up
    const contentChanged = markdown !== this.content
    if (this.props.onChange && this.content !== null && contentChanged) {
      this.content = markdown
      this.props.onChange(markdown)
    }
  }

  // focus and blur are used to implement the border-blur found on other widgets
  focus () {
    this.element.classList.add('active')
  }
  blur () {
    this.element.classList.remove('active')
  }

  componentDidMount () {
    const editor = new Editor({
      el: this.element,
      initialValue: this.props.value,
      initialEditType: (this.props.type.default_view === 'richtext') ? 'wysiwyg' : 'markdown',
      useCommandShortcut: true,
      usageStatistics: false,
      previewStyle: null,
      hideModeSwitch: true,
      toolbarItems: toolbarItems,
      hooks: {
        addImageBlobHook: this.onImageUpload
      },
      events: {
        load: this.onLoad,
        change: this.onChange,
        stateChange: this.onChange,
        contentChangedFromWysiwyg: () => { setTimeout(this.onChange, 100) },
        focus: this.focus,
        blur: this.blur
      },
      exts: ['lektorImage', 'lektorLink']
    })
    this.setState({
      editor: editor
    })
  }

  onRef (element) {
    if (element === null) {
      return
    }
    this.element = element
  }

  render () {
    return (
      <div>
        <div
          ref={this.onRef}
          style={this.state.style}
          className="toast-editor-widget"
        />
        <LektorImageExtension editor={this.state.editor} {...this.getRoutingProps()} />
        <LektorLinkExtension editor={this.state.editor} {...this.getRoutingProps()} />
      </div>
    )
  }
}

export default ToastEditor
