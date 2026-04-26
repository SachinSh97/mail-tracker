import { useState } from 'react'
import { NO_COLLECTION_ID } from '../constants/collections'
import { collectionsService } from '../services/collections.service'
import { trackersService } from '../services/trackers.service'
import type { Tracker } from '../services/types'
import { useMutation } from './useMutation'
import { useQuery } from './useQuery'

// Values for the "Save in collection" dropdown, besides real collection ids
export const NO_COLLECTION = ''
export const NEW_COLLECTION = '__new'

/** Splits "a@x.com, b@y.com" into a clean list */
function parseEmails(value: string): string[] {
  return value
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
}

interface Options {
  /** Collection to pick by default, e.g. when opened from a collection screen ("none" = no collection) */
  preselectedCollectionId: string | null
  onCreated: (tracker: Tracker) => void
}

/** State and submit logic for the "Add tracker" form */
export function useAddTrackerForm({ preselectedCollectionId, onCreated }: Options) {
  const collections = useQuery('collections', collectionsService.list)
  const collectionList = collections.data ?? []

  const [subject, setSubject] = useState('')
  const [recipients, setRecipients] = useState('')
  // null = the user hasn't picked yet, so we show a sensible default instead
  const [pickedCollection, setPickedCollection] = useState<string | null>(null)
  const [newCollectionName, setNewCollectionName] = useState('')

  // Default: the preselected collection, else the newest one, else "create a new one"
  const defaultCollection =
    preselectedCollectionId === NO_COLLECTION_ID
      ? NO_COLLECTION
      : (collectionList.find((collection) => collection.id === preselectedCollectionId)?.id ??
        collectionList[0]?.id ??
        NEW_COLLECTION)
  const collectionChoice = pickedCollection ?? (collections.data ? defaultCollection : NO_COLLECTION)
  const isCreatingCollection = collectionChoice === NEW_COLLECTION
  const collectionsReady = Boolean(collections.data || collections.error)

  const submit = useMutation(
    async () => {
      let collectionId = collectionChoice || undefined
      if (isCreatingCollection) {
        collectionId = (await collectionsService.create(newCollectionName.trim())).id
      }
      const tracker = await trackersService.create({
        emailSubject: subject.trim() || undefined,
        recipientEmails: parseEmails(recipients),
        collectionId,
      })
      onCreated(tracker)
    },
    { successMessage: 'Tracker added. Copy the pixel into your email.' },
  )

  return {
    subject,
    setSubject,
    recipients,
    setRecipients,
    collectionChoice,
    setCollectionChoice: setPickedCollection,
    newCollectionName,
    setNewCollectionName,
    isCreatingCollection,

    collections: collectionList,
    collectionsReady,
    collectionsError: collections.error,
    reloadCollections: collections.reload,

    submit: submit.run,
    submitting: submit.busy,
  }
}
