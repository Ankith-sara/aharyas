import Hero from '../components/Hero';
import ExploreCollections from '../components/ExploreCollections';
import LatestCollection from '../components/LatestCollection';
import BestSeller from '../components/BestSeller';
import WhatWeDo from '../components/WhatWeDo';
import CompanyProducts from '../components/CompanyProducts';
import usePageMeta from '../components/usePageMeta';

const Home = () => {
    usePageMeta({
        description: 'Discover and shop conscious luxury clothing, toys, home decor, and lifestyle essentials handcrafted by Indian artisans. Support rural craft heritage.'
    });

    return (
        <div>
            <Hero />
            <ExploreCollections />
            <LatestCollection />
            <BestSeller />
            <CompanyProducts />
            {/* <WhatWeDo /> */}
        </div>
    );
};

export default Home;
