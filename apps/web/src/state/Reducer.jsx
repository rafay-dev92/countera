
export const Reducer = (state, action) => {
    switch (action.type) {
        case 'SET_INVOICE':
            return ({
                ...state,
                Settings: {
                    ...state.Settings,
                    General: {
                        ...state.Settings.General,
                        invoice: action.payload
                    },
                }
            })
        case 'SET_TOKEN':
            return ({
                ...state,
                userToken: action.payload
            })
        case 'SET_BUSINESS':
            return ({
                ...state,
                business: action.payload
            })
        case 'SET_USER':
            return ({
                ...state,
                userInfo: action.payload,
            })
        case 'SET_INVOICE_VIEW':
            return ({
                ...state,
                invoice: {
                    ...state.invoice,
                    isViewOpen: action.payload
                }
            })
        case 'SET_INVOICE_VIEW_DATA':
            return ({
                ...state,
                invoice: {
                    ...state.invoice,
                    viewData: action.payload
                }
            })
        case 'SET_INVOICE_FORM':
            return ({
                ...state,
                invoice: {
                    ...state.invoice,
                    openForm: action.payload
                }
            })
        case 'SET_QUOTATION_VIEW':
            return ({
                ...state,
                quotation: {
                    isViewOpen: action.payload
                }
            }) 
        case 'SET_WORKORDER_VIEW':
            return ({
                ...state,
                workorder: {
                    isViewOpen: action.payload
                }
            })      
        case 'SET_INSPECTION_DATA':
            return ({
                ...state,
                inspection: {
                    selected: action.payload
                }
            })       
        case 'RESET':
            return ({
                Settings: {
                    General: {
                        invoice: 'current',
                    },
                },
                userToken: '',
                business: '',
                userInfo: {}
            })
        default:
            return state
    }
}
