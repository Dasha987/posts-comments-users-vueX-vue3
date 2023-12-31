import { createStore } from 'vuex'
import axios from 'axios'
import { POSTS_URL, USERS_URL, COMMENTS_URL, USER_POSTS_URL } from '@/api'
export const store = createStore({
    state: {
        users: [],
        comments: [],
        data: [],
        lengthComment: null,
        isLoading: false,
        activeBlock: 1,
        page: 0, //начальный номер страницы
        totalPage: 0, //количество страниц
        limitPost: 20, //количество постов на странице
        nameUser: ''
    },

    mutations: {
        setUsers(state, users) {
            state.users = users
        },
        setComments(state, comments) {
            state.comments = comments
        },
        setData(state, data) {
            state.data = data
        },
        setLengthComment(state, lengthComment) {
            state.lengthComment = lengthComment
        },
        setIsLoading(state, isLoading) {
            state.isLoading = isLoading
        },
        setActiveBlock(state, activeBlock) {
            state.activeBlock = activeBlock
        },
        setPage(state, page) {
            state.page = page;
        },
        setTotalPage(state, totalPage) {
            state.totalPage = totalPage;
        },
        setNameUser(state, nameUser) {
            state.nameUser = nameUser;
        },
    },
    actions: {
        setComments({ state, commit }, value) {
            const comment = { ...value }
            state.comments.push(comment)
            commit("setComments", state.comments)

            const post = state.data.findIndex(post => post.id == comment.postId)
            state.data[post].comments.push(comment)
            commit("setData", state.data)
        },
        setUserPosts({ commit, state }, id) {
            commit('setPage', 0)
            commit('setIsLoading', false);
            axios
                .get(`${USER_POSTS_URL}${id}`)
                .then(response => {
                    const nameUser = state.users.find(user => {
                        return user.id === id
                    }).name
                    commit("setNameUser", nameUser)
                    const data = response.data.map(post => ({
                        ...post,
                        name: nameUser,
                        comments: [...state.comments].filter(comment => post.id == comment.postId)
                    }))
                    commit("setData", data)
                    commit('setIsLoading', true);
                    commit('setActiveBlock', 1)
                })
                .catch(error => console.log(error))
        },
        async setData({ commit, state }) {
            commit("setNameUser", "")
            commit('setIsLoading', false);
            if (state.users.length == 0) {
                await axios
                    .get(USERS_URL)
                    .then(response => {
                        commit("setUsers", response.data)
                    })
                    .catch(error => console.log(error))
            }
            if (state.comments.length == 0) {
                await axios
                    .get(COMMENTS_URL)
                    .then(response => {
                        commit("setComments", response.data)
                        commit("setLengthComment", response.data.length + 1)
                    })
                    .catch(error => console.log(error))
            }

            await axios
                .get(`${POSTS_URL}?_page=${state.page}&_limit=${state.limitPost}`)
                .then(response => {
                    const data = response.data.map(post => ({
                        ...post,
                        name: state.users.find(user => {
                            return user.id === post.userId
                        }).name,
                        comments: state.comments.filter(comment => post.id == comment.postId)
                    }))
                    commit('setTotalPage', Math.ceil(response.headers["x-total-count"] / state.limitPost));
                    commit("setData", data)
                    commit('setIsLoading', true);

                })
                .catch(error => console.log(error))
        },
        async loadMoreData({ state, commit }) {
            commit('setPage', state.page + 1)
            axios
                .get(`${POSTS_URL}?_page=${state.page}&_limit=${state.limitPost}`)
                .then(response => {
                    const data = response.data.map(post => ({
                        ...post,
                        name: state.users.find(user => {
                            return user.id === post.userId
                        }).name,
                        comments: state.comments.filter(comment => post.id == comment.postId)
                    }))
                    commit('setTotalPage', Math.ceil(response.headers["x-total-count"] / state.limitPost)
                    );
                    commit('setData', [...state.data, ...data]);
                })
                .catch(error => console.log(error))
        },
    },
})
