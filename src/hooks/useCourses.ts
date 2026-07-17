import { useCallback } from 'react'
import type { Course } from '../types'
import { useLocalStorage } from './useLocalStorage'

export function useCourses() {
  const [courses, setCourses] = useLocalStorage<Course[]>('ld_courses', [])

  const addCourse = useCallback(
    (course: Course) => {
      setCourses((prev) => [...prev, course])
    },
    [setCourses]
  )

  const saveCourse = useCallback(
    (course: Course) => {
      const stamped = { ...course, updatedAt: new Date().toISOString() }
      setCourses((prev) => {
        const exists = prev.some((c) => c.id === stamped.id)
        return exists ? prev.map((c) => (c.id === stamped.id ? stamped : c)) : [...prev, stamped]
      })
    },
    [setCourses]
  )

  const deleteCourse = useCallback(
    (id: string) => {
      setCourses((prev) => prev.filter((c) => c.id !== id))
    },
    [setCourses]
  )

  const getCourse = useCallback((id: string) => courses.find((c) => c.id === id), [courses])

  return { courses, addCourse, saveCourse, deleteCourse, getCourse }
}
