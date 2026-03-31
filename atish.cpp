#include <bits/stdc++.h>
using namespace std;
#define fast_io cin.sync_with_stdio(false); cin.tie(0); cout.tie(0)
// #define int long long
#define ll long long
#define pb push_back
#define all(v) v.begin(), v.end()
#define rall(v) v.rbegin(), v.rend()
#define MOD 1000000007
#define INF (int)1e16
#define nl "\n"

#define vi vector<int>
#define vvi vector<vector<int> >
#define pii pair<int, int>

#define fr(i, a, b) for (int i = a; i < b; i++)
#define frr(i, a, b) for (int i = a; i > b; i--)

void sol() {
    string s = "ABDFTQRTZGRNPZ";
    vector<int> freq(26, 0);
    for(char c : s){
        freq[c-'A']++;
    }
    for(int i=0; i<s.size(); i++){
        cout<<s[i] << "->" <<freq[s[i]-'A']<<nl;
    }
}

int32_t main() {
    fast_io;
    
    int t = 1;
    // cin >> t;
    while(t--) {
        sol();
    }
    
}