if (window.self !== window.top) {
    let lastUrl = window.location.href;
    function notifyNavigation() {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            window.parent?.postMessage({
                type: "app_changed_url",
                url: currentUrl,
            }, "*");
        }
    }
    // Intercept history.pushState
    const originalPushState = history.pushState.bind(history);
    history.pushState = function (...args) {
        originalPushState(...args);
        notifyNavigation();
    };
    // Intercept history.replaceState
    const originalReplaceState = history.replaceState.bind(history);
    history.replaceState = function (...args) {
        originalReplaceState(...args);
        notifyNavigation();
    };
    // Handle browser back/forward navigation
    window.addEventListener("popstate", notifyNavigation);
    // Notify initial URL on load
    window.parent?.postMessage({
        type: "app_changed_url",
        url: window.location.href,
    }, "*");
}
export {};
                                               
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF2aWdhdGlvbi1ub3RpZmllci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9pbmplY3Rpb25zL25hdmlnYXRpb24tbm90aWZpZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUMvQixJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztJQUVuQyxTQUFTLGdCQUFnQjtRQUN2QixNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztRQUN4QyxJQUFJLFVBQVUsS0FBSyxPQUFPLEVBQUUsQ0FBQztZQUMzQixPQUFPLEdBQUcsVUFBVSxDQUFDO1lBQ3JCLE1BQU0sQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUN4QjtnQkFDRSxJQUFJLEVBQUUsaUJBQWlCO2dCQUN2QixHQUFHLEVBQUUsVUFBVTthQUNoQixFQUNELEdBQUcsQ0FDSixDQUFDO1FBQ0osQ0FBQztJQUNILENBQUM7SUFFRCw4QkFBOEI7SUFDOUIsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMxRCxPQUFPLENBQUMsU0FBUyxHQUFHLFVBQVUsR0FBRyxJQUFJO1FBQ25DLGlCQUFpQixDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDM0IsZ0JBQWdCLEVBQUUsQ0FBQztJQUNyQixDQUFDLENBQUM7SUFFRixpQ0FBaUM7SUFDakMsTUFBTSxvQkFBb0IsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNoRSxPQUFPLENBQUMsWUFBWSxHQUFHLFVBQVUsR0FBRyxJQUFJO1FBQ3RDLG9CQUFvQixDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDOUIsZ0JBQWdCLEVBQUUsQ0FBQztJQUNyQixDQUFDLENBQUM7SUFFRix5Q0FBeUM7SUFDekMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBRXRELDZCQUE2QjtJQUM3QixNQUFNLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FDeEI7UUFDRSxJQUFJLEVBQUUsaUJBQWlCO1FBQ3ZCLEdBQUcsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUk7S0FDMUIsRUFDRCxHQUFHLENBQ0osQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpZiAod2luZG93LnNlbGYgIT09IHdpbmRvdy50b3ApIHtcbiAgbGV0IGxhc3RVcmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcblxuICBmdW5jdGlvbiBub3RpZnlOYXZpZ2F0aW9uKCkge1xuICAgIGNvbnN0IGN1cnJlbnRVcmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICBpZiAoY3VycmVudFVybCAhPT0gbGFzdFVybCkge1xuICAgICAgbGFzdFVybCA9IGN1cnJlbnRVcmw7XG4gICAgICB3aW5kb3cucGFyZW50Py5wb3N0TWVzc2FnZShcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6IFwiYXBwX2NoYW5nZWRfdXJsXCIsXG4gICAgICAgICAgdXJsOiBjdXJyZW50VXJsLFxuICAgICAgICB9LFxuICAgICAgICBcIipcIlxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvLyBJbnRlcmNlcHQgaGlzdG9yeS5wdXNoU3RhdGVcbiAgY29uc3Qgb3JpZ2luYWxQdXNoU3RhdGUgPSBoaXN0b3J5LnB1c2hTdGF0ZS5iaW5kKGhpc3RvcnkpO1xuICBoaXN0b3J5LnB1c2hTdGF0ZSA9IGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgb3JpZ2luYWxQdXNoU3RhdGUoLi4uYXJncyk7XG4gICAgbm90aWZ5TmF2aWdhdGlvbigpO1xuICB9O1xuXG4gIC8vIEludGVyY2VwdCBoaXN0b3J5LnJlcGxhY2VTdGF0ZVxuICBjb25zdCBvcmlnaW5hbFJlcGxhY2VTdGF0ZSA9IGhpc3RvcnkucmVwbGFjZVN0YXRlLmJpbmQoaGlzdG9yeSk7XG4gIGhpc3RvcnkucmVwbGFjZVN0YXRlID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICBvcmlnaW5hbFJlcGxhY2VTdGF0ZSguLi5hcmdzKTtcbiAgICBub3RpZnlOYXZpZ2F0aW9uKCk7XG4gIH07XG5cbiAgLy8gSGFuZGxlIGJyb3dzZXIgYmFjay9mb3J3YXJkIG5hdmlnYXRpb25cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJwb3BzdGF0ZVwiLCBub3RpZnlOYXZpZ2F0aW9uKTtcblxuICAvLyBOb3RpZnkgaW5pdGlhbCBVUkwgb24gbG9hZFxuICB3aW5kb3cucGFyZW50Py5wb3N0TWVzc2FnZShcbiAgICB7XG4gICAgICB0eXBlOiBcImFwcF9jaGFuZ2VkX3VybFwiLFxuICAgICAgdXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZixcbiAgICB9LFxuICAgIFwiKlwiXG4gICk7XG59XG4iXSwieF9nb29nbGVfaWdub3JlTGlzdCI6WzBdfQ==