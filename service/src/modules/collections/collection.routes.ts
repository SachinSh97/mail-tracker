import { Router } from 'express'
import * as collectionController from './collection.controller.js'

export const collectionRouter = Router()

collectionRouter.post('/', collectionController.createCollection)
collectionRouter.get('/', collectionController.listCollections)
collectionRouter.get('/:collectionId', collectionController.getCollection)
collectionRouter.patch('/:collectionId', collectionController.updateCollection)
collectionRouter.delete('/:collectionId', collectionController.deleteCollection)
