import {ExcelComponent} from '@core/ExcelComponent';
import {createTable} from '@/components/table/table.template';
import {resizeHandler} from '@/components/table/table.resize';
import {isSell, matrix, nextSelector, shouldResize}
  from '@/components/table/table.functions';
import {TableSelection} from '@/components/table/TableSelection';
import {$} from '@core/dom';
import * as actions from '@/redux/actions'
import {defaultStyles} from '@/constants';

export class Table extends ExcelComponent {
  static className = 'excel__table'

  constructor($root, options) {
    super($root, {
      listeners: ['mousedown', 'keydown', 'input'],
      ...options
    });
  }

  prepare() {
    this.selection = new TableSelection()
  }

  toHTML() {
    return createTable(20, this.store.getState())
  }

  init() {
    super.init();
    this.selectCell(this.$root.find('[data-id="0:0"]'))

    this.$on('formula:input', text => {
      this.selection.current.text(text)
      this.updateTextInStore(text)
    })

    this.$on('formula:done', () => {
      this.selection.current.focus()
    })

    this.$on('toolbar:applyStyle', style => {
      console.log('Table style', style)
      this.selection.applyStyle(style)
    })
  }

  selectCell($cell) {
    this.selection.select($cell)
    this.$emit('table:select', $cell)
    console.log($cell.getStyles(Object.keys(defaultStyles)))
  }

  async resizeTable(event) {
    try {
      const data = await resizeHandler(this.$root, event)
      this.$dispatch(actions.tableResize(data))
      // console.log('Resize data', data)
    } catch (e) {
      console.warn('Resize Error', e.message)
    }
  }

  onMousedown(event) {
    if (shouldResize(event)) {
      this.resizeTable(event)
    } else if (isSell(event)) {
      const $target = $(event.target)
      if (event.shiftKey) {
        const $cells = matrix($target, this.selection.current).map((id) =>
          this.$root.find(`[data-id="${id}"]`))
        this.selection.selectGroup($cells)
      } else {
        this.selectCell($target)
      }
    }
  }

  onKeydown(event) {
    const keys = [
      'Enter',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'ArrowDown',
      'ArrowUp'
    ]

    const {key} = event

    if (keys.includes(key) && !event.shiftKey) {
      event.preventDefault()

      const id = this.selection.current.id(true)
      const $next = this.$root.find(nextSelector(key, id))

      this.selectCell($next)
    }
  }

  updateTextInStore(value) {
    this.$dispatch(actions.changeText({
      id: this.selection.current.id(),
      value
    }))
  }

  onInput(event) {
    this.updateTextInStore($(event.target).text())
  }
}


